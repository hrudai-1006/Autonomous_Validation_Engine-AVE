import asyncio
from sqlalchemy.orm import Session
from .base import BaseAgent
from .extraction import ExtractionAgent
from .enrichment import EnrichmentAgent
from .qa import QAAgent
from ..models import Provider, Validation

class Orchestrator(BaseAgent):
    def __init__(self, db: Session):
        super().__init__("Orchestrator", db)
        self.extractor = ExtractionAgent(db)
        self.enricher = EnrichmentAgent(db)
        self.qa = QAAgent(db)

    async def run_validation(self, file_content: bytes, filename: str):
        self.log(f"Starting validation workflow for file: {filename}")

        # Step 1: Extraction
        try:
            extracted_data = await self.extractor.extract(file_content, filename)
            if not extracted_data:
                self.log("Extraction returned no data. Aborting.", "ERROR")
                return None
        except Exception as e:
            self.log(f"Workflow aborted due to extraction error: {str(e)}", "ERROR")
            return None

        # Step 2 & 3: Batch Processing
        results = []
        if isinstance(extracted_data, dict):
             extracted_data = [extracted_data] # Normalize to list just in case
        
        self.log(f"Processing {len(extracted_data)} extracted entities...")

        for i, item in enumerate(extracted_data):
            # Step 2: Enrichment
            self.log(f"[{i+1}/{len(extracted_data)}] Enriching and Validating: {item.get('full_name', 'Unknown')}")
            
            try:
                registry_data = await self.enricher.enrich(item)
                
                # Step 3: QA / Validation
                result = await self.qa.validate(item, registry_data)
                results.append(result)
            except Exception as e:
                self.log(f"Error processing item {i+1}: {str(e)}", "ERROR")

        self.log(f"Workflow completed for {filename}. Processed {len(results)}/{len(extracted_data)} items.")
        return results
