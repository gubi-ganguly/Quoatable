from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class Product(BaseModel):
    """
    Product model representing product information extracted from emails or other sources.
    All fields are optional as product information may be incomplete.
    """
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = None
    quantity: Optional[int] = None
    part_number: Optional[str] = Field(None, alias="partNumber")
    part_number_type: Optional[str] = Field(None, alias="partNumberType")
    description: Optional[str] = None
 