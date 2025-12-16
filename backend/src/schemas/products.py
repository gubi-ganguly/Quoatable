from typing import Optional
from pydantic import BaseModel, Field

class Product(BaseModel):
    """
    Product model representing product information extracted from emails or other sources.
    All fields are optional as product information may be incomplete.
    """
    name: Optional[str] = None
    quantity: Optional[int] = None
    part_number: Optional[str] = Field(None, alias="partNumber")
    description: Optional[str] = None
