import msal
import requests

# Your credentials
MS_CLIENT_ID = "f6ede5f0-c4b7-4947-8fe3-04cc71889d93"
MS_TENANT_ID = "056044e6-20d2-4398-84b5-dcd4b27a018a"
AUTHORITY = f"https://login.microsoftonline.com/{MS_TENANT_ID}"
SCOPES = ["Mail.Read", "Mail.ReadWrite", "Mail.Send"]

# Use PublicClientApplication
app = msal.PublicClientApplication(
    MS_CLIENT_ID,
    authority=AUTHORITY
)

# Use device code flow - no browser popup, no redirect URI issues
flow = app.initiate_device_flow(scopes=SCOPES)

if "user_code" not in flow:
    raise ValueError(f"Failed to create device flow: {flow.get('error_description')}")

print(flow["message"])  # This will show you a code and URL to visit

# Wait for user to authenticate
result = app.acquire_token_by_device_flow(flow)

if "access_token" in result:
    access_token = result['access_token']
    
    # Get emails
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(
        'https://graph.microsoft.com/v1.0/me/messages',
        headers=headers
    )
    
    if response.status_code == 200:
        emails = response.json()
        print(f"\nSuccess! Found {len(emails.get('value', []))} emails")
        for email in emails.get('value', [])[:5]:
            print(f"Subject: {email.get('subject')}")
            print(f"From: {email.get('from', {}).get('emailAddress', {}).get('address')}")
            print("---")
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
else:
    print("Error:", result.get("error"))
    print("Description:", result.get("error_description"))  