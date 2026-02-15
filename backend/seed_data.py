from app.database import SessionLocal, engine, Base
from app.models import Provider, Validation, SystemConfig
from datetime import datetime

# Initialize DB
Base.metadata.create_all(bind=engine)
db = SessionLocal()

def seed():
    # Check if data exists
    if db.query(Provider).count() > 0:
        print("Data already seeded.")
        return

    print("Seeding dummy data...")
    
    # 1. System Config
    config = SystemConfig()
    db.add(config)

    # 2. Providers (Matching the screenshot)
    providers_data = [
        {
            "full_name": "Strange, Stephen",
            "npi": "5566778899",
            "specialty": "General Surgery",
            "status": "Flagged",
            "confidence_score": 80.0,
            "discrepancies": ["Address format/detail", "License Number", "Specialty (Extracted is less specific)"]
        },
        {
            "full_name": "Parker, Peter",
            "npi": "9988776655",
            "specialty": "Family Medicine",
            "status": "Validated",
            "confidence_score": 95.0,
            "discrepancies": []
        },
        {
            "full_name": "Howlett, James",
            "npi": "1122334455",
            "specialty": "Dermatology",
            "status": "Validated",
            "confidence_score": 85.0,
            "discrepancies": ["Address format/detail"]
        },
        {
            "full_name": "Connor, Sarah",
            "npi": "9876543210",
            "specialty": "General Practice",
            "status": "Validated",
            "confidence_score": 100.0,
            "discrepancies": []
        },
        {
            "full_name": "Doe, John",
            "npi": "1234567890",
            "specialty": "Cardiology",
            "status": "Validated",
            "confidence_score": 100.0,
            "discrepancies": []
        }
    ]

    for p_data in providers_data:
        provider = Provider(
            full_name=p_data["full_name"],
            npi=p_data["npi"],
            specialty=p_data["specialty"],
            address="123 Dummy Lane", # Placeholder
            license="DUMMY-LIC",
            status=p_data["status"],
            confidence_score=p_data["confidence_score"]
        )
        db.add(provider)
        db.flush()
        
        validation = Validation(
            provider_id=provider.id,
            status=p_data["status"],
            confidence_score=p_data["confidence_score"],
            discrepancies=p_data["discrepancies"],
            extracted_data={"full_name": p_data["full_name"]}, # Minimal mock
            registry_data={"full_name": p_data["full_name"]},
            timestamp=datetime.utcnow()
        )
        db.add(validation)

    db.commit()
    print("Seeding complete.")

if __name__ == "__main__":
    seed()
