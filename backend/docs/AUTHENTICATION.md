# Authentication Guide: Outlook Integration

This guide explains how the authentication system works in the Quotable application, connecting the Frontend (Next.js) with the Backend (FastAPI) and Microsoft's Identity Platform.

## Overview

The application uses the standard **OAuth 2.0 Authorization Code Flow** to securely log users in with their Microsoft (Outlook) accounts. This method is the industry standard for web applications and ensures that the user's password never touches our application directly.

### High-Level Flow

1.  **User Clicks Login**: Frontend asks Backend for a special Microsoft Login URL.
2.  **User Logs In**: User is redirected to Microsoft to sign in.
3.  **Microsoft Redirects Back**: Microsoft sends a temporary "Authorization Code" to the Frontend.
4.  **Code Exchange**: Frontend sends this code to the Backend.
5.  **Token Acquisition**: Backend swaps the code for an Access Token and creates a Session.
6.  **Session Active**: Frontend stores the Session ID and uses it for future API calls.

---

## Detailed Step-by-Step Flow

### 1. Initiation (Frontend -> Backend -> Microsoft)

**User Action:** User clicks "Sign in with Outlook" on the homepage (`/`).

1.  **Frontend Request:**
    The frontend calls `POST /auth/initiate`.

2.  **Backend Response:**
    The backend uses the `MS_CLIENT_ID` and `MS_REDIRECT_URI` to construct a secure login URL and returns it.
    ```json
    {
      "auth_url": "https://login.microsoftonline.com/.../oauth2/v2.0/authorize?client_id=...&response_type=code...",
      "session_id": "random-uuid-state"
    }
    ```

3.  **Redirect:**
    The frontend redirects the user's browser to this `auth_url`.

### 2. User Authentication (Microsoft Identity Platform)

1.  **Microsoft Login Page:**
    The user is now on `microsoftonline.com`. They enter their email and password.
    *   *Note: Our application does not see this process.*

2.  **Consent:**
    If it's the first time, Microsoft asks the user: *"Quotable would like to access your email. Do you accept?"*

3.  **Redirect Back:**
    Upon success, Microsoft redirects the browser back to our application's callback URL:
    `http://localhost:3000/auth/callback?code=AQABAA...&state=random-uuid-state`

### 3. Completion (Frontend -> Backend)

**User Action:** The user lands on the `/auth/callback` page with a loading spinner.

1.  **Code Extraction:**
    The Frontend reads the `code` and `state` (session_id) from the URL query parameters.

2.  **Exchange Request:**
    The Frontend calls `POST /auth/callback` with these details:
    ```json
    {
      "code": "AQABAA...",
      "session_id": "random-uuid-state"
    }
    ```

3.  **Token Exchange (Backend Internal):**
    The Backend receives the code and securely talks to Microsoft (`login.microsoftonline.com/token`).
    *   It sends: `client_id`, `client_secret`, and `code`.
    *   Microsoft verifies the secret and returns an **Access Token** and **Refresh Token**.

4.  **Session Creation:**
    The Backend stores these tokens in memory (or database), mapped to the `session_id`.
    *   *Security Note: The Access Token is never sent to the Frontend.*

5.  **Success Response:**
    The Backend tells the Frontend that login was successful and returns the user's email.
    ```json
    {
      "is_authenticated": true,
      "user_email": "user@example.com",
      "message": "Authentication successful"
    }
    ```

### 4. Post-Login (Frontend)

1.  **Redirect:**
    The Frontend redirects the user to their personal inbox: `/quotable/user@example.com/inbox`.

2.  **API Calls:**
    For all subsequent requests (e.g., getting emails), the Frontend sends the `session_id` in the header:
    ```
    X-Session-Id: random-uuid-state
    ```

3.  **Validation:**
    The Backend looks up the Access Token using the `X-Session-Id` and uses it to fetch data from Microsoft Graph API on the user's behalf.

---

## Configuration Reference

### Backend (`.env`)
These secrets allow the backend to prove its identity to Microsoft.

| Variable | Description |
| :--- | :--- |
| `MS_CLIENT_ID` | Public ID of the Azure App Registration. |
| `MS_CLIENT_SECRET` | Secret key (password) for the App Registration. **Keep safe.** |
| `MS_TENANT_ID` | `common` (for multi-tenant) or specific Tenant ID. |
| `MS_REDIRECT_URI` | `http://localhost:3000/auth/callback` (Must match Azure exactly). |

### Frontend
No secrets are stored in the Frontend. It only handles the `session_id` and public URLs.

---

## Troubleshooting Common Issues

*   **"Redirect URI Mismatch"**: The URL in `MS_REDIRECT_URI` (`.env`) does not match the URL registered in the Azure Portal > Authentication > Web.
*   **"Invalid Client Secret"**: The `MS_CLIENT_SECRET` is wrong or expired.
*   **Session Errors**: If the server restarts, in-memory sessions are lost. The user must log in again. (In production, use Redis/DB).
