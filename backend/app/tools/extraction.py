from crewai.tools import BaseTool
from typing import Type
from pydantic import BaseModel, Field
import mimetypes
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class FileExtractionToolInput(BaseModel):
    file_path: str = Field(..., description="The parameter is the absolute path to the local file (image, PDF, CSV, or text) that needs to be analyzed.")

class FileExtractionTool(BaseTool):
    name: str = "Medical File Exaction Tool"
    description: str = (
        "Analyzes a medical file (Image, PDF, CSV, or Text) to extract provider information. "
        "Handles the file parsing and LLM processing directly. "
        "Returns a JSON string containing the extracted provider data."
    )
    args_schema: Type[BaseModel] = FileExtractionToolInput

    def _run(self, file_path: str) -> str:
        """
        Processes the file using Google Gemini API directly for multimodal understanding.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return "Error: GEMINI_API_KEY not found in environment."

        genai.configure(api_key=api_key)
        
        # Determine strict model usage (downgraded to 1.5-flash for stability if needed, 
        # but usage said 2.5-flash-lite is available. We'll use the same.)
        # Actually proper vision usually works best with 1.5-flash or 2.0-flash. 
        # Let's stick to the verified working one or 1.5-flash which is very stable for vision.
        # User successfully used 2.5-flash-lite (confirmed by 'Model Updated' message).
        model_name = "gemini-2.5-flash" 

        try:
            # Detect Mime Type
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                # Fallback for CSV vs Text
                if file_path.endswith(".csv"):
                    mime_type = "text/csv"
                else:
                    mime_type = "text/plain"

            # 1. Text/CSV Handling
            if mime_type.startswith("text/") or mime_type == "text/csv":
                with open(file_path, "r", errors='ignore') as f:
                    content = f.read()
                
                prompt = f"""
                Analyze this text/CSV content and extract provider information.
                
                DATA:
                {content[:30000]}  # Limit context to avoid overflow

                Return a JSON array of provider objects with these fields:
                - full_name: The provider's full name
                - npi: NPI number (digits only, or null if not found)
                - specialty: Medical specialty
                - address: Full address
                - license: License number

                IMPORTANT:
                - Extract ONLY what is explicitly visible.
                - If NPI is missing or not clear, set it to null.
                - Do NOT guess or hallucinate values.
                """
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                return response.text

            # 2. Image/PDF Handling (Multimodal)
            else:
                # Upload file to Gemini (File API)
                # Note: For small files we can pass data inline, but File API is safer for PDFs.
                # However, inline data is faster for single request. 
                # Let's try inline data for images, File API for PDF?
                # Actually, standard GenAI python lib supports `cookie_picture` style parts.
                
                with open(file_path, "rb") as f:
                    file_data = f.read()

                model = genai.GenerativeModel(model_name)
                
                prompt_text = """
                Analyze this medical document (Image/PDF) and extract provider information.
                
                Return a JSON array of provider objects with these fields:
                - full_name: The provider's full name
                - npi: NPI number (digits only, or null if not found)
                - specialty: Medical specialty
                - address: Full address
                - license: License number

                IMPORTANT:
                - Extract ONLY what is explicitly visible.
                - If NPI is missing or not clear, set it to null.
                - Do NOT guess or hallucinate values.
                """
                
                # Construct parts
                response = model.generate_content(
                    [
                        {"mime_type": mime_type, "data": file_data},
                        prompt_text
                    ],
                    generation_config={"response_mime_type": "application/json"}
                )
                return response.text

        except Exception as e:
            return f"Extraction Error: {str(e)}"
