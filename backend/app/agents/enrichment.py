import os
import json
import google.generativeai as genai
from .base import BaseAgent
from sqlalchemy.orm import Session
import asyncio

class EnrichmentAgent(BaseAgent):
    def __init__(self, db: Session):
        super().__init__("Enrichment Agent", db)
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)

    async def enrich(self, extracted_data: dict) -> dict:
        npi = extracted_data.get("npi")
        self.log(f"Querying CMS NPI Registry (Simulated via Gemini) for NPI: {npi}")
        
        if not self.api_key:
            error_msg = "GEMINI_API_KEY missing. Cannot utilize Gemini for Registry Simulation."
            self.log(error_msg, "ERROR")
            raise ValueError(error_msg)

        try:
            # Construct the Simulation Prompt
            model = genai.GenerativeModel("gemini-2.5-flash-lite")
            
            prompt = f"""
            Simulate a CMS NPI Registry lookup and response for this provider search:
            {json.dumps(extracted_data)}

            ACT AS THE OFFICIAL REGISTRY DATABASE.
            1. Standardize Address: Convert to official USPS uppercase format (e.g., "123 Main St" -> "123 MAIN STREET, NEW YORK, NY 10001").
            2. Normalize Specialty: Map to standard provider taxonomy (e.g., "Cardio" -> "Cardiology").
            3. Verification:
               - If the NPI looks real, try to provide accurate details if known.
               - If the NPI is clearly fake or unknown, generate a STATISTICALLY PROBABLE valid record.
               - IMPORTANT: To simulate real-world validation issues, occasionally introduce minor discrepancies (e.g., old address vs new address, middle name missing).
            
            Return ONLY valid JSON with this exact schema:
            {{
              "full_name": string (official legal name),
              "npi": string,
              "specialty": string,
              "address": string (official practice location),
              "license": string,
              "status": "Active" | "Inactive"
            }}
            """

            response = await asyncio.to_thread(
                model.generate_content,
                prompt
            )

            text_response = response.text
            clean_text = text_response.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            registry_data = json.loads(clean_text)
            
            self.log(f"Registry Data Retrieved (Simulated): {registry_data.get('full_name')}", "SUCCESS")
            return registry_data

        except Exception as e:
            self.log(f"Enrichment Simulation Failed: {str(e)}", "ERROR")
            # Fail safe return of input data to prevent crash
            return extracted_data
