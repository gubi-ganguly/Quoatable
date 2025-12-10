from typing import List, Optional, Any, Literal, Dict
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from datetime import datetime

# --- Shared Models ---

class EmailAddress(BaseModel):
    email: str = Field(..., alias="address")
    name: Optional[str] = None

class Recipient(BaseModel):
    emailAddress: EmailAddress

    @classmethod
    def from_email(cls, email: str, name: Optional[str] = None):
        return cls(emailAddress=EmailAddress(address=email, name=name))

class EmailRecipientInput(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class Attachment(BaseModel):
    id: Optional[str] = None
    name: str
    content_type: str = Field(..., alias="contentType")
    size: int
    is_inline: bool = Field(False, alias="isInline")
    # Graph API typically returns 'contentBytes' or 'contentId' depending on type
    content_bytes: Optional[str] = Field(None, alias="contentBytes") 
    
    model_config = ConfigDict(populate_by_name=True)

class AttachmentInput(BaseModel):
    name: str
    content_type: str
    content_base64: str

# --- Response Models ---

class EmailResponse(BaseModel):
    id: str
    subject: Optional[str] = None
    body_preview: Optional[str] = Field(None, alias="bodyPreview")
    # Graph API returns body as {contentType: ..., content: ...}
    # We'll return it as is for now, or the client can parse it.
    body: Optional[Dict[str, str]] = None 
    from_: Optional[Recipient] = Field(None, alias="from")
    to_recipients: List[Recipient] = Field([], alias="toRecipients")
    cc_recipients: List[Recipient] = Field([], alias="ccRecipients")
    received_datetime: datetime = Field(..., alias="receivedDateTime")
    sent_datetime: datetime = Field(..., alias="sentDateTime")
    is_read: bool = Field(..., alias="isRead")
    is_draft: bool = Field(..., alias="isDraft")
    importance: str
    has_attachments: bool = Field(..., alias="hasAttachments")
    conversation_id: Optional[str] = Field(None, alias="conversationId")
    web_link: Optional[str] = Field(None, alias="webLink")

    model_config = ConfigDict(populate_by_name=True)

class EmailListResponse(BaseModel):
    emails: List[EmailResponse]
    count: int

# --- Request Models ---

class SendEmailRequest(BaseModel):
    subject: str
    body: str
    body_content_type: Literal["text", "html"] = "html"
    to_recipients: List[EmailRecipientInput]
    cc_recipients: List[EmailRecipientInput] = []
    bcc_recipients: List[EmailRecipientInput] = []
    importance: Literal["low", "normal", "high"] = "normal"
    attachments: List[AttachmentInput] = []
    save_to_sent: bool = True

class SimpleSendEmailRequest(BaseModel):
    to: str # comma separated or single
    subject: str
    body: str
    body_type: Literal["text", "html"] = "html"
    cc: Optional[List[str]] = None

class ReplyEmailRequest(BaseModel):
    reply_body: Optional[str] = None # If None, empty body
    reply_all: bool = False
    body_type: Literal["text", "html"] = "html"

class ForwardEmailRequest(BaseModel):
    to_recipients: List[str]
    comment: Optional[str] = None

class MarkReadRequest(BaseModel):
    is_read: bool

# --- Auth Models ---

class AuthUrlResponse(BaseModel):
    auth_url: str
    session_id: str

class AuthCallbackRequest(BaseModel):
    code: str
    session_id: str

class AuthStatusResponse(BaseModel):
    is_authenticated: bool
    user_email: Optional[str] = None
    message: str
