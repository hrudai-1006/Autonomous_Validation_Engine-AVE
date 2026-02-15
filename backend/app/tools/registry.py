from crewai.tools import BaseTool
from typing import Type
from pydantic import BaseModel, Field
import requests
import json

class NPIRegistrySearchToolInput(BaseModel):
    npi_number: str = Field(..., description="The 10-digit NPI number to search for.")

class NPIRegistrySearchTool(BaseTool):
    name: str = "NPI Registry Search"
    description: str = (
        "Search for a healthcare provider by their NPI number in the official CMS NPI Registry. "
        "Returns JSON with provider details if found."
    )
    args_schema: Type[BaseModel] = NPIRegistrySearchToolInput

    def _run(self, npi_number: str) -> str:
        """
        Queries the CMS NPI Registry API for the given NPI number.
        """
        url = f"https://npiregistry.cms.hhs.gov/api/?version=2.1&number={npi_number}"
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Check results
            if "results" not in data or not data["results"]:
                return json.dumps({
                    "npi_number": npi_number,
                    "registry_found": False,
                    "status": "Not Found"
                })
            
            result = data["results"][0]
            basic = result.get("basic", {})
            addresses = result.get("addresses", [])
            taxonomies = result.get("taxonomies", [])
            
            # Extract primary address (usually purpose='LOCATION')
            primary_address = next((addr for addr in addresses if addr.get("address_purpose") == "LOCATION"), addresses[0] if addresses else {})
            
            # Construct formatted address
            addr_parts = [
                primary_address.get("address_1", ""),
                primary_address.get("address_2", ""),
                primary_address.get("city", ""),
                primary_address.get("state", ""),
                primary_address.get("postal_code", "")
            ]
            full_address = ", ".join([p for p in addr_parts if p]).strip()
            
            # Extract primary specialty
            primary_specialty = next((t.get("desc") for t in taxonomies if t.get("primary")), "Unknown")
            
            output = {
                "npi_number": str(result.get("number")),
                "provider_name": f"{basic.get('first_name', '')} {basic.get('last_name', '')} {basic.get('credential', '')}".strip() or basic.get("organization_name", ""),
                "enumeration_type": result.get("enumeration_type", ""),
                "primary_specialty": primary_specialty,
                "organization_name": basic.get("organization_name", ""),
                "address": full_address,
                "status": basic.get("status", ""),
                "registry_found": True
            }
            
            return json.dumps(output, indent=2)
            
        except Exception as e:
            return json.dumps({
                "npi_number": npi_number,
                "registry_found": False,
                "error": str(e)
            })
