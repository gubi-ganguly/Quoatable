from fastapi import APIRouter
from src.api.v1 import auth_routes, email_routes, crm_routes

api_router = APIRouter()

api_router.include_router(auth_routes.router)
api_router.include_router(email_routes.router)
api_router.include_router(crm_routes.router)

