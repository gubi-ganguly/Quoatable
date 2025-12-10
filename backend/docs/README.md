# MS Graph Email Service

A robust, RESTful API microservice designed to simplify interactions with Microsoft Outlook and Exchange via the Microsoft Graph API.

This project abstracts the complexity of OAuth2 Device Code flows and raw Graph API calls into a clean, easy-to-use HTTP interface for reading, searching, and sending emails.

## 🚀 Key Features

*   **Zero-Browser Authentication**: Uses the OAuth2 Device Code flow, perfect for headless servers, background workers, or CLI tools.
*   **Rich Email Reading**:
    *   Fetch emails by folder (Inbox, Sent, Drafts, etc.).
    *   Advanced filtering (Date ranges, Unread status, Sender, Attachments).
    *   Search capabilities.
*   **Email Sending**:
    *   Support for HTML and Text bodies.
    *   Full attachment support (Base64 encoded).
    *   CC/BCC handling.
    *   Save-to-sent options.
*   **Email Management**:
    *   Mark as Read/Unread.
    *   Delete emails.
    *   Reply and Forward.
*   **Modern Stack**: Built with Python 3.13+, FastAPI, Pydantic, and MSAL.

## 📂 Project Structure

```
src/
├── api/            # API Route definitions (Endpoints)
├── core/           # Configuration and Settings
├── schemas/        # Pydantic models (Data Validation)
└── services/       # Business logic (MS Graph interaction)
```

## 🛠️ Setup & Installation

### 1. Prerequisites
*   Python 3.10 or higher.
*   An Azure Cloud Account.
*   **Azure AD Application**: You need to register an app in Azure Active Directory.
    *   **Supported Account Types**: Accounts in this organizational directory only (Single tenant) or Multitenant.
    *   **Redirect URI**: Not required for Device Code flow (ensure "Allow public client flows" is enabled in Authentication settings > Advanced settings).
    *   **API Permissions**: Add `Mail.Read`, `Mail.ReadWrite`, `Mail.Send` (Delegated permissions).

### 2. Installation

Clone the repository and install dependencies:

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install requirements
pip install -r requirements/requirements.txt
```

### 3. Configuration

Create a `.env` file in the project root (copied from `.env.example`):

```ini
MS_CLIENT_ID=your_azure_client_id
MS_TENANT_ID=your_azure_tenant_id
```

## 🚦 Usage

Start the development server:

```bash
uvicorn src.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Documentation
*   **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
*   **Detailed Guide**: See [API_GUIDE.md](./API_GUIDE.md) for endpoint specifics.

## 🔐 Authentication Flow

This service uses the **Device Code Flow**:

1.  Call `POST /auth/initiate` to get a `user_code` and `verification_uri`.
2.  The user (or admin) visits the URI and enters the code.
3.  Call `POST /auth/complete` with the session ID to finalize the login.
4.  Use the returned `session_id` in the `X-Session-Id` header for all future requests.

