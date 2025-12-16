from typing import List, Optional, Literal
from fastapi import APIRouter, Header, HTTPException, Query, Path, Body
from src.services.email.service import email_service
from src.services.llm.service import llm_service
from src.schemas.email import (
    EmailListResponse, EmailResponse, SendEmailRequest, SimpleSendEmailRequest, 
    ReplyEmailRequest, ForwardEmailRequest, MarkReadRequest, Attachment,
    EmailAnalysisResponse
)

router = APIRouter(prefix="/emails", tags=["Emails"])

def get_service_or_401(session_id: str):
    try:
        # Check if session exists/token valid
        email_service.get_token(session_id)
        return email_service
    except ValueError:
        raise HTTPException(status_code=401, detail="Session not found or not authenticated. Please authenticate first.")

@router.get("", response_model=EmailListResponse)
def get_emails(
    x_session_id: str = Header(..., alias="X-Session-Id"),
    limit: int = Query(25, ge=1, le=100),
    skip: int = Query(0, ge=0),
    folder: str = "inbox",
    date_filter: Optional[Literal["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "last_7_days", "last_30_days"]] = None,
    unread_only: bool = False,
    has_attachments: Optional[bool] = None,
    importance: Optional[Literal["low", "normal", "high"]] = None,
    from_address: Optional[str] = None,
    search: Optional[str] = None,
    order_by: str = "receivedDateTime desc",
    include_body: bool = True
):
    service = get_service_or_401(x_session_id)
    try:
        return service.get_emails(
            session_id=x_session_id,
            folder=folder,
            limit=limit,
            skip=skip,
            search=search,
            date_filter=date_filter,
            unread_only=unread_only,
            has_attachments=has_attachments,
            from_address=from_address,
            order_by=order_by,
            include_body=include_body
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/today", response_model=EmailListResponse)
def get_today_emails(
    x_session_id: str = Header(..., alias="X-Session-Id"),
    limit: int = 50,
    folder: str = "inbox",
    unread_only: bool = False
):
    service = get_service_or_401(x_session_id)
    return service.get_emails(
        session_id=x_session_id,
        folder=folder,
        limit=limit,
        date_filter="today",
        unread_only=unread_only
    )

@router.get("/this-week", response_model=EmailListResponse)
def get_this_week_emails(
    x_session_id: str = Header(..., alias="X-Session-Id"),
    limit: int = 50,
    folder: str = "inbox",
    unread_only: bool = False
):
    service = get_service_or_401(x_session_id)
    return service.get_emails(
        session_id=x_session_id,
        folder=folder,
        limit=limit,
        date_filter="this_week",
        unread_only=unread_only
    )

@router.get("/recent", response_model=EmailListResponse)
def get_recent_emails(
    x_session_id: str = Header(..., alias="X-Session-Id"),
    count: int = Query(10, alias="count"),
    folder: str = "inbox",
    include_body: bool = False
):
    service = get_service_or_401(x_session_id)
    return service.get_emails(
        session_id=x_session_id,
        folder=folder,
        limit=count,
        include_body=include_body,
        order_by="receivedDateTime desc"
    )

@router.get("/unread", response_model=EmailListResponse)
def get_unread_emails(
    x_session_id: str = Header(..., alias="X-Session-Id"),
    limit: int = 25,
    folder: str = "inbox"
):
    service = get_service_or_401(x_session_id)
    return service.get_emails(
        session_id=x_session_id,
        folder=folder,
        limit=limit,
        unread_only=True
    )

@router.get("/sent", response_model=EmailListResponse)
def get_sent_emails(
    x_session_id: str = Header(..., alias="X-Session-Id"),
    limit: int = 25,
    skip: int = 0,
    date_filter: Optional[str] = None
):
    service = get_service_or_401(x_session_id)
    return service.get_emails(
        session_id=x_session_id,
        folder="sentitems",
        limit=limit,
        skip=skip,
        date_filter=date_filter
    )

@router.get("/from/{sender_email}", response_model=EmailListResponse)
def get_emails_from_sender(
    sender_email: str,
    x_session_id: str = Header(..., alias="X-Session-Id"),
    limit: int = 25,
    folder: str = "inbox"
):
    service = get_service_or_401(x_session_id)
    return service.get_emails(
        session_id=x_session_id,
        folder=folder,
        limit=limit,
        from_address=sender_email
    )

@router.get("/important", response_model=EmailListResponse)
def get_important_emails(
    x_session_id: str = Header(..., alias="X-Session-Id"),
    limit: int = 25,
    folder: str = "inbox",
    unread_only: bool = False
):
    service = get_service_or_401(x_session_id)
    return service.get_emails(
        session_id=x_session_id,
        folder=folder,
        limit=limit,
        unread_only=unread_only
    )

@router.get("/with-attachments", response_model=EmailListResponse)
def get_emails_with_attachments(
    x_session_id: str = Header(..., alias="X-Session-Id"),
    limit: int = 25,
    folder: str = "inbox",
    date_filter: Optional[str] = None
):
    service = get_service_or_401(x_session_id)
    return service.get_emails(
        session_id=x_session_id,
        folder=folder,
        limit=limit,
        date_filter=date_filter,
        has_attachments=True
    )

@router.post("/send", status_code=201)
def send_email(
    request: SendEmailRequest,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    service = get_service_or_401(x_session_id)
    try:
        service.send_email(x_session_id, request)
        return {"success": True, "message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/drafts", response_model=EmailResponse, status_code=201)
def create_draft(
    request: SendEmailRequest,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    service = get_service_or_401(x_session_id)
    try:
        return service.create_draft(x_session_id, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send/simple", status_code=201)
def send_simple_email(
    request: SimpleSendEmailRequest,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    service = get_service_or_401(x_session_id)
    try:
        service.send_simple_email(x_session_id, request)
        return {"success": True, "message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{email_id}", response_model=EmailResponse)
def get_email_detail(
    email_id: str,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    service = get_service_or_401(x_session_id)
    email = service.get_email(x_session_id, email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email

@router.get("/{email_id}/attachments", response_model=List[Attachment])
def get_email_attachments(
    email_id: str,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    service = get_service_or_401(x_session_id)
    try:
        return service.get_email_attachments(x_session_id, email_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{email_id}/read")
def mark_email_read(
    email_id: str,
    request: MarkReadRequest,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    service = get_service_or_401(x_session_id)
    try:
        service.mark_as_read(x_session_id, email_id, request.is_read)
        return {"success": True, "message": "Email marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{email_id}")
def delete_email(
    email_id: str,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    service = get_service_or_401(x_session_id)
    try:
        service.delete_email(x_session_id, email_id)
        return {"success": True, "message": "Email deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{email_id}/reply")
def reply_email(
    email_id: str,
    request: ReplyEmailRequest,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    service = get_service_or_401(x_session_id)
    try:
        service.reply_email(x_session_id, email_id, request)
        return {"success": True, "message": "Reply sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{email_id}/forward")
def forward_email(
    email_id: str,
    request: ForwardEmailRequest,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    service = get_service_or_401(x_session_id)
    try:
        service.forward_email(x_session_id, email_id, request)
        return {"success": True, "message": "Email forwarded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{email_id}/analyze", response_model=EmailAnalysisResponse)
async def analyze_email(
    email_id: str,
    x_session_id: str = Header(..., alias="X-Session-Id")
):
    # 1. Get the email content using EmailService
    # Note: get_email is synchronous, but we're in an async function. 
    # For this scale it's fine, but in high load scenarios this should be offloaded or made async.
    email_service_instance = get_service_or_401(x_session_id)
    email = email_service_instance.get_email(x_session_id, email_id)
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    subject = email.get("subject", "")
    
    # Handle body content properly (Graph returns dict or str)
    body_data = email.get("body", {})
    if isinstance(body_data, dict):
        body_content = body_data.get("content", "")
    else:
        body_content = str(body_data)
    
    # 2. Analyze intent using LLMService
    intent = await llm_service.analyze_email_intent(subject, body_content)
    
    # 3. If it is a request, extract products immediately
    products = []
    if intent.get("is_customer_request"):
        product_data = await llm_service.extract_product_data(subject, body_content)
        products = product_data.get("products", [])

    return {
        "is_customer_request": intent.get("is_customer_request"),
        "confidence": intent.get("confidence"),
        "reasoning": intent.get("reasoning"),
        "products": products
    }
