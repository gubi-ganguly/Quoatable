# VT Redirect Email API Guide

A comprehensive guide to the Email API for Microsoft Outlook integration.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Email Reading Endpoints](#email-reading-endpoints)
  - [Email Filtering Endpoints](#email-filtering-endpoints)
  - [Email Actions Endpoints](#email-actions-endpoints)
  - [Email Sending Endpoints](#email-sending-endpoints)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

The VT Redirect Email API provides a RESTful interface for interacting with Microsoft Outlook emails via the Microsoft Graph API. It supports:

- **OAuth Authentication** via Authorization Code Flow (Web Apps)
- **Reading Emails** with powerful filtering and search
- **Sending Emails** with attachments and HTML support
- **Email Actions** like reply, forward, mark as read, and delete

### Base URL

```
http://localhost:8000
```

### Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Getting Started

### Prerequisites

1. Python 3.10+
2. Microsoft Azure AD application with Mail permissions
3. Environment variables configured

### Environment Setup

Create a `.env` file in the project root:

```env
MS_CLIENT_ID=your-azure-client-id
MS_CLIENT_SECRET=your-azure-client-secret
MS_TENANT_ID=your-azure-tenant-id
MS_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Running the API

```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements/requirements.txt

# Start the server
uvicorn src.main:app --reload
```

---

## Authentication

The API uses the standard **Microsoft OAuth 2.0 Authorization Code Flow**. This is designed for web applications where the frontend redirects the user to Microsoft to log in.

### Authentication Flow

```
┌─────────────┐     1. POST /auth/initiate      ┌─────────────┐
│   Client    │ ─────────────────────────────▶  │    API      │
│ (Frontend)  │ ◀─────────────────────────────  │  (Backend)  │
└─────────────┘     Returns: auth_url,          └─────────────┘
       │               session_id
       │
       │ 2. Redirect browser to auth_url
       ▼
┌─────────────┐
│  Microsoft  │  User logs in & consents
│   Login     │
└─────────────┘
       │
       │ 3. Redirects back to Frontend
       │    (e.g., /auth/callback?code=...&state=...)
       ▼
┌─────────────┐     4. POST /auth/callback      ┌─────────────┐
│   Client    │ ─────────────────────────────▶  │    API      │
│ (Frontend)  │     (sends code & session_id)   │             │
│             │ ◀─────────────────────────────  │             │
└─────────────┘     Returns: success, email     └─────────────┘
       │
       │ 5. Use session_id for all requests
       ▼
┌─────────────┐     GET /emails                 ┌─────────────┐
│   Client    │ ─────────────────────────────▶  │    API      │
│             │   Header: X-Session-Id          │             │
└─────────────┘                                 └─────────────┘
```

---

## API Endpoints

### Authentication Endpoints

#### POST `/auth/initiate`

Start the authentication flow. Returns the URL to redirect the user to.

**Request:** No body required

**Response:**
| Field | Type | Description |
|-------|------|-------------|
| `auth_url` | string | Microsoft login URL to redirect to |
| `session_id` | string | Unique session ID (used as 'state') |

---

#### POST `/auth/callback`

Complete the authentication by exchanging the code for a token.

**Request Body:**
```json
{
  "code": "AQABAA...",
  "session_id": "your-session-id"
}
```

**Response:**
| Field | Type | Description |
|-------|------|-------------|
| `is_authenticated` | boolean | Whether authentication succeeded |
| `user_email` | string | Authenticated user's email |
| `message` | string | Status message |

---

#### GET `/auth/status`

Check current authentication status.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `X-Session-Id` | Yes | Session ID from authentication |

**Response:**
```json
{
  "is_authenticated": true,
  "user_email": "user@example.com",
  "message": "Session status: authenticated"
}
```

---

#### POST `/auth/logout`

End the session and clear authentication.

**Headers:** `X-Session-Id` required

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### Email Reading Endpoints

#### GET `/emails`

List emails with powerful filtering options.

**Headers:** `X-Session-Id` required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 25 | Number of emails (1-100) |
| `skip` | integer | 0 | Pagination offset |
| `folder` | string | "inbox" | Mail folder |
| `date_filter` | enum | - | Pre-built date filter (see below) |
| `unread_only` | boolean | false | Only unread emails |
| `has_attachments` | boolean | - | Filter by attachments |
| `from_address` | string | - | Filter by sender email |
| `search` | string | - | Full-text search |
| `order_by` | string | "receivedDateTime desc" | Sort order |
| `include_body` | boolean | true | Include email body |

**Date Filter Options:**
- `today` - Emails received today
- `yesterday` - Emails received yesterday
- `this_week` - Emails from current week (Mon-Sun)
- `last_week` - Emails from previous week
- `this_month` - Emails from current month
- `last_month` - Emails from previous month
- `last_7_days` - Emails from last 7 days
- `last_30_days` - Emails from last 30 days

**Folder Options:**
- `inbox` - Inbox
- `sentitems` - Sent Items
- `drafts` - Drafts
- `deleteditems` - Deleted Items
- `junkemail` - Junk Email

**Response:**
```json
{
  "emails": [
    {
      "id": "AAMkAGI2...",
      "subject": "Meeting Tomorrow",
      "body": {
        "contentType": "html",
        "content": "<html>...</html>"
      },
      "from_": {
        "emailAddress": {
            "email": "sender@example.com",
            "name": "John Doe"
        }
      },
      "to_recipients": [
          {
              "emailAddress": {
                  "email": "you@example.com",
                  "name": "You"
              }
          }
      ],
      "received_datetime": "2024-12-05T10:30:00Z",
      "sent_datetime": "2024-12-05T10:29:55Z",
      "is_read": false,
      "is_draft": false,
      "importance": "normal",
      "has_attachments": true,
      "conversation_id": "AAQkAGI2...",
      "web_link": "https://outlook.office365.com/..."
    }
  ],
  "count": 1
}
```

---

#### GET `/emails/{email_id}`

Get a specific email by ID.

**Headers:** `X-Session-Id` required

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `email_id` | The unique email ID |

---

#### GET `/emails/{email_id}/attachments`

Get attachments for a specific email.

**Headers:** `X-Session-Id` required

**Response:**
```json
[
  {
    "id": "AAMkAGI2...",
    "name": "document.pdf",
    "content_type": "application/pdf",
    "size": 125000,
    "is_inline": false,
    "content_bytes": null
  }
]
```

---

### Email Filtering Endpoints

These convenience endpoints provide quick access to common queries.

#### GET `/emails/today`

Get emails received today.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of emails |
| `folder` | string | "inbox" | Mail folder |
| `unread_only` | boolean | false | Only unread |

---

#### GET `/emails/this-week`

Get emails received this week (since Monday).

**Query Parameters:** Same as `/emails/today`

---

#### GET `/emails/recent`

Get the X most recent emails.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | integer | 10 | Number of emails (1-100) |
| `folder` | string | "inbox" | Mail folder |
| `include_body` | boolean | false | Include body (faster if false) |

---

#### GET `/emails/unread`

Get unread emails.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 25 | Number of emails |
| `folder` | string | "inbox" | Mail folder |

---

#### GET `/emails/sent`

Get sent emails.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 25 | Number of emails |
| `skip` | integer | 0 | Pagination offset |
| `date_filter` | enum | - | Date filter |

---

#### GET `/emails/from/{sender_email}`

Get emails from a specific sender.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `sender_email` | Sender's email address |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 25 | Number of emails |
| `folder` | string | "inbox" | Mail folder |

---

#### GET `/emails/with-attachments`

Get emails that have attachments.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 25 | Number of emails |
| `folder` | string | "inbox" | Mail folder |
| `date_filter` | enum | - | Date filter |

---

### Email Actions Endpoints

#### PATCH `/emails/{email_id}/read`

Mark an email as read or unread.

**Headers:** `X-Session-Id` required

**Request Body:**
```json
{
  "is_read": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email marked as read"
}
```

---

#### DELETE `/emails/{email_id}`

Delete an email (moves to Deleted Items).

**Headers:** `X-Session-Id` required

**Response:**
```json
{
  "success": true,
  "message": "Email deleted successfully"
}
```

---

### Email Sending Endpoints

#### POST `/emails/send`

Send an email with full control over all fields.

**Headers:** `X-Session-Id` required

**Request Body:**
```json
{
  "subject": "Meeting Tomorrow",
  "body": "<p>Don't forget about our meeting at 2pm!</p>",
  "body_content_type": "html",
  "to_recipients": [
    {"email": "colleague@example.com", "name": "John Doe"}
  ],
  "cc_recipients": [
    {"email": "manager@example.com"}
  ],
  "bcc_recipients": [],
  "importance": "normal",
  "attachments": [
    {
      "name": "agenda.pdf",
      "content_type": "application/pdf",
      "content_base64": "JVBERi0xLjQK..."
    }
  ],
  "save_to_sent": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

---

#### POST `/emails/drafts`

Create a draft email without sending it.

**Headers:** `X-Session-Id` required

**Request Body:** Same as `/emails/send`

**Response:** Returns the created email object (see GET /emails response format).

---

#### POST `/emails/send/simple`

Send a basic email with minimal parameters.

**Headers:** `X-Session-Id` required

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Hello!",
  "body": "<p>This is a test email.</p>",
  "body_type": "html",
  "cc": ["another@example.com"]
}
```

**Note:** The `to` field supports comma-separated email addresses.

---

#### POST `/emails/{email_id}/reply`

Reply to an existing email.

**Headers:** `X-Session-Id` required

**Request Body:**
```json
{
  "reply_body": "<p>Thanks for your email!</p>",
  "reply_all": false,
  "body_type": "html"
}
```

---

#### POST `/emails/{email_id}/forward`

Forward an email to new recipients.

**Headers:** `X-Session-Id` required

**Request Body:**
```json
{
  "to_recipients": ["user@example.com", "another@example.com"],
  "comment": "FYI - please see the email below"
}
```

---

## Error Handling

The API returns standard HTTP status codes and JSON error responses.

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Authentication required or failed |
| `404` | Not Found - Resource not found |
| `500` | Internal Server Error |

---

## Examples

### Python Example (Using `requests`)

```python
import requests

BASE_URL = "http://localhost:8000"

# Step 1: Initiate Auth (Get URL)
response = requests.post(f"{BASE_URL}/auth/initiate")
data = response.json()
print(f"Go here to login: {data['auth_url']}")
session_id = data["session_id"]

# ... User logs in via browser and redirects back ...
# Assume we got the code from the redirect
auth_code = input("Enter the code from the callback URL: ")

# Step 2: Complete Auth
requests.post(f"{BASE_URL}/auth/complete", json={
    "code": auth_code, 
    "session_id": session_id
})

# Set up headers for all future requests
headers = {"X-Session-Id": session_id}

# Get today's unread emails
response = requests.get(
    f"{BASE_URL}/emails/today",
    headers=headers,
    params={"unread_only": True}
)
emails = response.json()
print(f"Found {emails['count']} unread emails today")
```
