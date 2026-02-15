from .base import BaseAgent
from sqlalchemy.orm import Session
from ..models import Validation, Provider
from datetime import datetime
import asyncio

class QAAgent(BaseAgent):
    def __init__(self, db: Session):
        super().__init__("Quality Assurance Agent", db)

    async def validate(self, extracted: dict, registry: dict) -> Validation:
        self.log("Comparing Source vs. Registry...")
        await asyncio.sleep(0.5)

        discrepancies = []
        score = 100.0

        # Logic: Compare fields
        # 1. Name
        if extracted["full_name"].lower() != registry["full_name"].lower():
             discrepancies.append("Name mismatch")
             score -= 20
        
        # 2. Specialty (Fuzzy match logic simulation)
        if extracted["specialty"].lower() not in registry["specialty"].lower():
             discrepancies.append(f"Specialty mismatch: '{extracted['specialty']}' vs '{registry['specialty']}'")
             score -= 10
        elif extracted["specialty"] != registry["specialty"]:
             # Partial match (e.g. Surgery vs General Surgery)
             discrepancies.append("Specialty (Extracted is less specific)")
             score -= 5

        # 3. Address
        if extracted["address"] != registry["address"]:
             discrepancies.append("Address format/detail")
             score -= 5 # Minor penalty for format

        # 4. License
        if extracted["license"] != registry["license"]:
             discrepancies.append("License Number mismatch")
             score -= 15

        # Get Threshold from DB
        from ..models import SystemConfig
        config = self.db.query(SystemConfig).first()
        threshold = config.confidence_threshold * 100 if config else 85.0
        
        status = "Validated" if score >= threshold else "Flagged"
        
        self.log(f"Validation Complete. Score: {score}% ({status})", "SUCCESS" if status == "Validated" else "WARN")

        # Save to DB
        provider = Provider(
            full_name=extracted["full_name"],
            npi=extracted["npi"],
            specialty=extracted["specialty"],
            address=extracted["address"],
            license=extracted["license"],
            status=status,
            confidence_score=score
        )
        self.db.add(provider)
        self.db.flush() # get ID

        validation = Validation(
            provider_id=provider.id,
            status=status,
            confidence_score=score,
            discrepancies=discrepancies,
            extracted_data=extracted,
            registry_data=registry,
            timestamp=datetime.utcnow()
        )
        self.db.add(validation)
        self.db.commit()
        
        return validation
