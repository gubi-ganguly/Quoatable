from fastapi import APIRouter, Header, HTTPException, Body
from src.services.email.service import email_service
from src.schemas.email import AuthUrlResponse, AuthCallbackRequest, AuthStatusResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/initiate", response_model=AuthUrlResponse)
def initiate_auth():
    """Start the auth code authentication flow."""
    try:
        return email_service.initiate_auth()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/callback", response_model=AuthStatusResponse)
def auth_callback(request: AuthCallbackRequest):
    """Complete the auth code authentication flow."""
    try:
        return email_service.complete_auth(request.code, request.session_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status", response_model=AuthStatusResponse)
def auth_status(x_session_id: str = Header(..., alias="X-Session-Id")):
    """Check current authentication status."""
    try:
        # Just try to get user profile to verify token
        user = email_service.get_user_profile(x_session_id)
        return {
            "is_authenticated": True,
            "user_email": user.get("mail") or user.get("userPrincipalName"),
            "message": "Session status: authenticated"
        }
    except ValueError:
        return {
            "is_authenticated": False,
            "message": "Session not found or expired"
        }
    except Exception as e:
        return {
            "is_authenticated": False,
            "message": f"Error: {str(e)}"
        }

@router.post("/logout")
def logout(x_session_id: str = Header(..., alias="X-Session-Id")):
    email_service.logout(x_session_id)
    return {"message": "Logged out successfully"}
