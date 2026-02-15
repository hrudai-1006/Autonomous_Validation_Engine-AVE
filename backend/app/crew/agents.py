"""
AVE Agent Definitions using CrewAI

This module defines the three specialized agents:
1. Extraction Agent - Extracts provider data from documents
2. Enrichment Agent - Finds matching official registry records
3. QA Agent - Validates and scores the data
"""

import os
from crewai import Agent, LLM

# Configure LLM to use Google Gemini
llm = LLM(
    model="gemini/gemini-2.5-flash",
    api_key=os.getenv("GEMINI_API_KEY")
)

from ..tools.registry import NPIRegistrySearchTool
from ..tools.extraction import FileExtractionTool

# ... (rest of imports)

# Agent 1: Extraction Agent
extraction_agent = Agent(
    role='Medical Document Extractor',
    goal='Extract provider information from uploaded documents with high accuracy, including names, NPI numbers, specialties, addresses, and license numbers.',
    backstory="""You are an expert OCR and NLP specialist trained to read medical documents.
    You can parse PDFs, images, and scanned forms to extract structured provider information.
    You delegate the actual file analysis to your 'File Exaction Tool' which handles the vision processing.
    You are meticulous about accuracy and always return data in a clean JSON format.""",
    tools=[FileExtractionTool()],
    llm=llm,
    verbose=True,
    allow_delegation=False
)

# ... (rest of imports)

# Agent 2: Enrichment Agent
enrichment_agent = Agent(
    role='Registry Data Enricher',
    goal='Find matching official records from public registries like the CMS NPI Registry.',
    backstory="""You are a specialized agent with direct access to the CMS NPI Registry API.
    Given a provider's NPI number, you use your 'NPI Registry Search' tool to find the official record.
    You extract key details like name, specialty, address, and license status to ground the data in truth.
    CRITICAL: You never hallucinate or make up data. If the tool returns nothing, you report that exactly.""",
    tools=[NPIRegistrySearchTool()],
    llm=llm,
    verbose=True,
    allow_delegation=False,
    max_iter=1
)

# Agent 3: QA (Quality Assurance) Agent
qa_agent = Agent(
    role='Quality Assurance Validator',
    goal='Compare extracted data against registry data and calculate confidence scores. Flag discrepancies.',
    backstory="""You are a meticulous auditor who compares two data sources.
    You calculate a confidence score starting from 100% and deduct points for mismatches.
    You are fair but strict, and you clearly list all discrepancies found.""",
    tools=[],
    llm=llm,
    verbose=True,
    allow_delegation=False,
    max_iter=1
)
