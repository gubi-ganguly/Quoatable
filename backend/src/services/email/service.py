import msal
import requests
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from src.core.config import settings
from src.schemas.email import (
    SendEmailRequest, SimpleSendEmailRequest, ReplyEmailRequest, 
    ForwardEmailRequest, AttachmentInput
)

# In-memory storage for demonstration purposes
# In production, use Redis or a database
TOKENS = {} # session_id -> token_dict (containing access_token)

class EmailService:
    def __init__(self):
        self.client_id = settings.MS_CLIENT_ID
        self.client_secret = settings.MS_CLIENT_SECRET
        self.authority = settings.authority
        self.scopes = settings.SCOPES
        self.redirect_uri = settings.MS_REDIRECT_URI
        self.graph_url = settings.GRAPH_API_BASE_URL
        
        self.app = msal.ConfidentialClientApplication(
            self.client_id,
            authority=self.authority,
            client_credential=self.client_secret
        )

    def initiate_auth(self) -> Dict[str, Any]:
        """Start the authorization code flow."""
        session_id = str(uuid.uuid4())
        
        auth_url = self.app.get_authorization_request_url(
            self.scopes,
            state=session_id,
            redirect_uri=self.redirect_uri
        )
        
        return {
            "auth_url": auth_url,
            "session_id": session_id
        }

    def complete_auth(self, code: str, session_id: str) -> Dict[str, Any]:
        """Exchange the auth code for a token."""
        result = self.app.acquire_token_by_authorization_code(
            code,
            scopes=self.scopes,
            redirect_uri=self.redirect_uri
        )
        
        if "access_token" in result:
            TOKENS[session_id] = result
            
            # Get user info to return email
            user_info = self.get_user_profile(session_id)
            return {
                "is_authenticated": True,
                "user_email": user_info.get("mail") or user_info.get("userPrincipalName"),
                "message": "Authentication successful"
            }
        else:
            error_desc = result.get('error_description') or result.get('error') or "Unknown error"
            return {
                "is_authenticated": False,
                "message": f"Authentication failed: {error_desc}"
            }

    def get_token(self, session_id: str) -> str:
        token_data = TOKENS.get(session_id)
        if not token_data:
            raise ValueError("Session not authenticated")
        
        # In a real app, check expiration and refresh if needed
        # MSAL's acquire_token_silent handles cache and refresh automatically if we use the cache
        # Since we are storing the token dict, we can try to refresh if expired
        # but for this simple POC, we'll return the access token.
        
        return token_data["access_token"]

    def _get_headers(self, session_id: str) -> Dict[str, str]:
        token = self.get_token(session_id)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def get_user_profile(self, session_id: str) -> Dict[str, Any]:
        headers = self._get_headers(session_id)
        resp = requests.get(f"{self.graph_url}/me", headers=headers)
        resp.raise_for_status()
        return resp.json()

    def logout(self, session_id: str):
        if session_id in TOKENS:
            del TOKENS[session_id]

    def get_emails(
        self, 
        session_id: str,
        folder: str = "inbox",
        limit: int = 25,
        skip: int = 0,
        search: Optional[str] = None,
        date_filter: Optional[str] = None,
        unread_only: bool = False,
        has_attachments: Optional[bool] = None,
        from_address: Optional[str] = None,
        order_by: str = "receivedDateTime desc",
        include_body: bool = True
    ) -> Dict[str, Any]:
        
        headers = self._get_headers(session_id)
        endpoint = f"{self.graph_url}/me/mailFolders/{folder}/messages"
        
        # Build query params
        params = {
            "$top": limit,
            "$skip": skip,
            "$orderby": order_by,
            "$expand": "attachments($select=id,name,contentType,size,isInline)"
        }
        
        if not include_body:
            params["$select"] = "subject,receivedDateTime,from,isRead,hasAttachments,importance"

        filters = []
        
        if unread_only:
            filters.append("isRead eq false")
            
        if has_attachments is not None:
            filters.append(f"hasAttachments eq {'true' if has_attachments else 'false'}")
            
        if from_address:
            filters.append(f"from/emailAddress/address eq '{from_address}'")
            
        # Date filters
        now = datetime.now()
        today = now.date()
        
        if date_filter == "today":
            filters.append(f"receivedDateTime ge {today.isoformat()}")
        elif date_filter == "yesterday":
            yesterday = today - timedelta(days=1)
            filters.append(f"receivedDateTime ge {yesterday.isoformat()} and receivedDateTime lt {today.isoformat()}")
        elif date_filter == "this_week":
            # Monday of this week
            start = today - timedelta(days=today.weekday())
            filters.append(f"receivedDateTime ge {start.isoformat()}")
        elif date_filter == "last_week":
            start = today - timedelta(days=today.weekday() + 7)
            end = today - timedelta(days=today.weekday())
            filters.append(f"receivedDateTime ge {start.isoformat()} and receivedDateTime lt {end.isoformat()}")
        elif date_filter == "last_7_days":
             start = today - timedelta(days=7)
             filters.append(f"receivedDateTime ge {start.isoformat()}")

        if filters:
            params["$filter"] = " and ".join(filters)

        if search:
            params["$search"] = f'"{search}"'

        response = requests.get(endpoint, headers=headers, params=params)
        if response.status_code != 200:
            raise Exception(f"Error fetching emails: {response.text}")
            
        data = response.json()
        return {
            "emails": data.get("value", []),
            "count": len(data.get("value", []))
        }

    def get_email(self, session_id: str, email_id: str) -> Dict[str, Any]:
        headers = self._get_headers(session_id)
        response = requests.get(f"{self.graph_url}/me/messages/{email_id}", headers=headers)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    def get_email_attachments(self, session_id: str, email_id: str) -> List[Dict[str, Any]]:
        headers = self._get_headers(session_id)
        response = requests.get(f"{self.graph_url}/me/messages/{email_id}/attachments", headers=headers)
        response.raise_for_status()
        return response.json().get("value", [])

    def _build_message_payload(self, request: SendEmailRequest) -> Dict[str, Any]:
        message = {
            "subject": request.subject,
            "body": {
                "contentType": request.body_content_type.capitalize(),
                "content": request.body
            },
            "toRecipients": [
                {"emailAddress": {"address": r.email, "name": r.name}} 
                for r in request.to_recipients
            ],
            "ccRecipients": [
                {"emailAddress": {"address": r.email, "name": r.name}} 
                for r in request.cc_recipients
            ],
            "bccRecipients": [
                {"emailAddress": {"address": r.email, "name": r.name}} 
                for r in request.bcc_recipients
            ],
            "importance": request.importance
        }
        
        if request.attachments:
            message["attachments"] = [
                {
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    "name": att.name,
                    "contentType": att.content_type,
                    "contentBytes": att.content_base64
                }
                for att in request.attachments
            ]
        return message

    def send_email(self, session_id: str, request: SendEmailRequest):
        headers = self._get_headers(session_id)
        message = self._build_message_payload(request)
        
        payload = {
            "message": message,
            "saveToSentItems": request.save_to_sent
        }
        
        response = requests.post(f"{self.graph_url}/me/sendMail", headers=headers, json=payload)
        response.raise_for_status()
        return True

    def create_draft(self, session_id: str, request: SendEmailRequest) -> Dict[str, Any]:
        headers = self._get_headers(session_id)
        message = self._build_message_payload(request)
        
        response = requests.post(f"{self.graph_url}/me/messages", headers=headers, json=message)
        response.raise_for_status()
        return response.json()

    def send_simple_email(self, session_id: str, request: SimpleSendEmailRequest):
        # Convert simple to full request
        to_list = [t.strip() for t in request.to.split(",") if t.strip()]
        to_recipients = [{"email": t} for t in to_list]
        
        full_req = SendEmailRequest(
            subject=request.subject,
            body=request.body,
            body_content_type=request.body_type,
            to_recipients=to_recipients,
            cc_recipients=[{"email": c} for c in (request.cc or [])]
        )
        return self.send_email(session_id, full_req)

    def mark_as_read(self, session_id: str, email_id: str, is_read: bool):
        headers = self._get_headers(session_id)
        payload = {"isRead": is_read}
        response = requests.patch(f"{self.graph_url}/me/messages/{email_id}", headers=headers, json=payload)
        response.raise_for_status()
        return True

    def delete_email(self, session_id: str, email_id: str):
        headers = self._get_headers(session_id)
        response = requests.delete(f"{self.graph_url}/me/messages/{email_id}", headers=headers)
        response.raise_for_status()
        return True
    
    def reply_email(self, session_id: str, email_id: str, request: ReplyEmailRequest):
        headers = self._get_headers(session_id)
        action = "replyAll" if request.reply_all else "reply"
        
        payload = {}
        if request.reply_body:
            payload["comment"] = request.reply_body
            
        response = requests.post(f"{self.graph_url}/me/messages/{email_id}/{action}", headers=headers, json=payload)
        response.raise_for_status()
        return True

    def forward_email(self, session_id: str, email_id: str, request: ForwardEmailRequest):
        headers = self._get_headers(session_id)
        
        payload = {
            "toRecipients": [
                {"emailAddress": {"address": email}} 
                for email in request.to_recipients
            ],
            "comment": request.comment
        }
        
        response = requests.post(f"{self.graph_url}/me/messages/{email_id}/forward", headers=headers, json=payload)
        response.raise_for_status()
        return True

email_service = EmailService()
