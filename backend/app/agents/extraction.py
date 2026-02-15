from .base import BaseAgent
from sqlalchemy.orm import Session
from app.models import SystemConfig
import asyncio
import random

class ExtractionAgent(BaseAgent):
    def __init__(self, db: Session):
        super().__init__("Extraction Agent", db)

import os
import json
import google.generativeai as genai
from typing import Optional

class ExtractionAgent(BaseAgent):
    def __init__(self, db: Session):
        super().__init__("Extraction Agent", db)
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)

    async def extract(self, file_content: bytes, filename: str) -> list:
        self.log(f"Reading file: {filename}...")
        
        # Check for API Key
        if not self.api_key:
            error_msg = "GEMINI_API_KEY not found in environment variables. Process terminated."
            self.log(error_msg, "ERROR")
            raise ValueError(error_msg)

        try:
            self.log("Using Gemini Vision Model for extraction...", "INFO")
            
            # Determine mime type
            mime_type = "application/pdf"
            if filename.lower().endswith(".png"):
                mime_type = "image/png"
            elif filename.lower().endswith((".jpg", ".jpeg")):
                mime_type = "image/jpeg"
            elif filename.lower().endswith(".csv"):
                mime_type = "text/csv"
            elif filename.lower().endswith(".txt"):
                mime_type = "text/plain"

            # Create generation config
            model_name = "gemini-2.5-flash-lite" 
            generation_config = {
                "response_mime_type": "application/json",
            }
            
            # Fetch System Config
            config = self.db.query(SystemConfig).first()
            is_single_mode = config and config.extraction_mode == "single"
            
            mode_instruction = "Extract ALL providers found in the document."
            limit_instruction = "- Return a LIST `[]` even if there is only one provider."
            
            if is_single_mode:
                mode_instruction = "Extract ONLY the MAIN provider. Ignore others if multiple exist."
                limit_instruction = "- Return a valid JSON LIST with exactly ONE object."

            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=generation_config,
                system_instruction=f"""You are a medical document extraction engine.
Extract provider details and return a VALID JSON LIST of objects with the following schema:
[
  {{
      "provider_name": string,
      "npi": string | null,
      "specialty": string | null,
      "address": string | null,
      "license_number": string | null,
      "confidence_notes": string
  }}
]
{mode_instruction}
Ensure:
{limit_instruction}
- Missing fields -> null
- NPI must be digits only
- Address normalized
- Specialty mapped to common medical terms
"""
            )

            # Input preparation
            content_part = {
                "mime_type": mime_type,
                "data": file_content
            }
            
            prompt = "Extract all provider information from this document. Return a JSON list."
            if is_single_mode:
                prompt = "Extract ONLY the single most prominent provider in this document. Do NOT extract others. Return a JSON list with one item."

            self.log(f"Extraction Mode: {'SINGLE' if is_single_mode else 'BATCH'}", "INFO")

            # Generate
            response = await asyncio.to_thread(
                model.generate_content,
                [prompt, content_part]
            )
            
            # Parse result
            text_response = response.text
            self.log(f"Gemini Raw Response: {text_response[:200]}...", "INFO") # Log start of response
            
            clean_text = text_response.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
                
            data = json.loads(clean_text)
            
            # Ensure data is a list
            if not isinstance(data, list):
                if isinstance(data, dict):
                    data = [data]
                else:
                    raise ValueError("Gemini response is not a list or dict")

            mapped_results = []
            for item in data:
                mapped_results.append({
                    "full_name": item.get("provider_name"),
                    "npi": item.get("npi"),
                    "specialty": item.get("specialty"),
                    "address": item.get("address"),
                    "license": item.get("license_number")
                })
            
            self.log(f"Extraction successful via Gemini. Found {len(mapped_results)} providers.", "SUCCESS")
            return mapped_results

        except Exception as e:
            self.log(f"Gemini extraction failed: {str(e)}", "ERROR")
            raise e # Re-raise to show actual error instead of fallback

    async def _dummy_extract(self) -> dict:
        await asyncio.sleep(1) # Simulate processing time
        self.log("Identifying provider entities (Dummy)...")
        await asyncio.sleep(0.5)

        # Mock extracted data
        extracted = {
            "full_name": "Stephen Strange",
            "npi": "5566778899",
            "specialty": "Surgery", # Intentionally vague 
            "address": "177A Bleecker St New York",
            "license": "NY-123456"
        }
        
        self.log(f"Extracted: {extracted['full_name']} (NPI: {extracted['npi']})", "SUCCESS")
        return extracted
