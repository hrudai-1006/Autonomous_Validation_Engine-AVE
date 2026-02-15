"""
AVE Task Definitions using CrewAI

This module defines factory functions to create tasks dynamically
based on the input data at runtime.
"""

from crewai import Task
from .agents import extraction_agent, enrichment_agent, qa_agent


def create_extraction_task(file_path: str, filename: str, extraction_mode: str = "batch") -> Task:
    """
    Create an extraction task for a given file.
    
    Args:
        file_path: Path to the image/PDF file
        filename: Name of the file being processed
        extraction_mode: "single" or "batch"
    """
    mode_instruction = "Extract ALL providers found in the document." if extraction_mode == "batch" else "Extract ONLY the MAIN provider. Ignore others if multiple exist."
    
    return Task(
        description=f"""Analyze the uploaded file at '{file_path}' and extract provider information.

{mode_instruction}

1. Use the 'Medical File Exaction Tool' to process the file at: {file_path}
2. The tool will return the extracted JSON data.
3. Review the data and ensure it matches the required format.

Return a JSON array of provider objects with these fields:
- full_name: The provider's full name
- npi: NPI number (digits only, or null if not found)
- specialty: Medical specialty
- address: Full address
- license: License number

IMPORTANT:
- Extract ONLY what is explicitly visible in the document.
- If NPI is missing or not clear, set it to null.
- Do NOT guess or hallucinate values.""",
        expected_output="""A valid JSON array of provider objects. Example:
[
  {
    "full_name": "Dr. Stephen Strange",
    "npi": "1234567890",
    "specialty": "Neurosurgery",
    "address": "177A Bleecker St, New York, NY",
    "license": "NY-123456"
  }
]""",
        agent=extraction_agent
    )


def create_enrichment_task(extracted_provider: dict) -> Task:
    """
    Create an enrichment task to find official registry data for a provider.
    
    Args:
        extracted_provider: Dictionary containing extracted provider data
    """
    return Task(
        description=f"""Find the official NPI registry record for this provider:

Provider Name: {extracted_provider.get('full_name', 'Unknown')}
NPI (claimed): {extracted_provider.get('npi', 'Not provided')}

1.  Identify the NPI number from the input.
2.  Use the 'NPI Registry Search' tool to query the CMS database.
3.  If the tool returns a match, return the JSON from the tool.
4.  If the tool returns "Not Found", "registry_found": false, or error, RETURN THAT EXACT STATUS.
5.  If NO NPI is provided, RETURN "registry_found": false immediately.

CRITICAL RULES:
- YOU CANNOT SEARCH BY NAME. The tool requires an NPI.
- IF NPI IS MISSING OR INVALID -> RETURN "registry_found": false.
- DO NOT SIMULATE OR MAKE UP DATA.
- YOUR JOB IS TO VALIDATE, NOT TO CREATE.""",
        expected_output="""A JSON object with official registry data:
{
  "npi_number": "1234567890",
  "provider_name": "Official Name",
  "enumeration_type": "NPI-1",
  "primary_specialty": "Cardiology",
  "organization_name": "Clinic Name",
  "address": "123 Main St, City, ST",
  "status": "Active",
  "registry_found": true
}""",
        agent=enrichment_agent
    )


def create_qa_task(extracted_data: dict, registry_data: dict, confidence_threshold: float = 0.78) -> Task:
    """
    Create a QA task to validate extracted data against registry data.
    
    Args:
        extracted_data: Provider data from extraction
        registry_data: Official data from registry lookup
        confidence_threshold: Minimum score to be considered "Validated"
    """
    threshold_percent = int(confidence_threshold * 100)
    
    return Task(
        description=f"""Compare the extracted provider data with the official registry data.

EXTRACTED DATA:
{extracted_data}

REGISTRY DATA:
{registry_data}

Calculate a confidence score using these rules:
- CRITICAL: If 'registry_found' is false or REGISTRY DATA is empty/error -> Score = 0. Stop there.
- Otherwise, start at 100% and apply penalties:
- Name mismatch: -20 points
- License mismatch: -15 points
- Specialty mismatch (total): -10 points
- Specialty mismatch (minor): -5 points
- Address format difference: -5 points

Threshold for "Validated" status: {threshold_percent}%
Below threshold = "Flagged" status

IMPORTANT OUTPUT RULES:
- Return ONLY the raw JSON object.
- Do NOT use markdown formatting (no ```json ... ```).
- Do NOT include any introductory text.""",
        expected_output=f"""A valid JSON object (no markdown) with validation results:
{{
  "confidence_score": 85,
  "status": "Validated",
  "discrepancies": [],
  "summary": "Matched perfectly."
}}""",
        agent=qa_agent
    )
