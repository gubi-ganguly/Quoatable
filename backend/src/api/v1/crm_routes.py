from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from src.services.crm.service import crm_service

router = APIRouter(prefix="/crm", tags=["crm"])

class OpportunityCreate(BaseModel):
    opportunityName: Optional[str] = None
    accountName: Optional[str] = None
    keyContact: Optional[str] = None
    products: Optional[List[Dict[str, Any]]] = None
    # Add other fields as needed

@router.post("/opportunity")
async def create_opportunity(opportunity: OpportunityCreate):
    """
    Creates an opportunity in the CRM.
    """
    try:
        result = crm_service.create_opportunity(opportunity.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/opportunity/{oid}")
async def get_opportunity(oid: str):
    """
    Retrieves an opportunity from the CRM.
    """
    result = crm_service.get_opportunity(oid)
    if not result:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return result
