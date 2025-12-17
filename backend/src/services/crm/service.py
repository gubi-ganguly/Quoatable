from typing import Dict, Any, Optional, Tuple

class CRMService:
    def deduce_account_info(self, from_data: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
        """
        Deduces Account Name and Key Contact from the sender's email information.
        
        Args:
            from_data: The 'from' field from the email object (Graph API format).
                       Expected structure: {'emailAddress': {'name': '...', 'address': '...'}}
                       
        Returns:
            Tuple containing (account_name, key_contact)
        """
        if not from_data:
            return None, None
        
        email_address_data = from_data.get("emailAddress", {})
        email = email_address_data.get("address", "")
        name = email_address_data.get("name", "")
        
        # Key Contact: Use name if available, otherwise email local part
        key_contact = name
        if not key_contact and email:
             key_contact = email.split("@")[0].replace(".", " ").title()
        
        # Account Name: Deduce from domain
        account_name = None
        if email and "@" in email:
            domain = email.split("@")[1]
            
            # List of common public email domains to ignore for account naming (optional, but good practice)
            # For now, we will just process whatever domain is there as requested.
            
            if "." in domain:
                # Remove TLD (e.g., .com, .co.uk) - simple approach: take everything before the last dot
                # For 'acme.co.uk', this might be 'acme.co', which isn't perfect but simple.
                # Better approach for now: take the first part of the domain.
                # e.g. company.com -> company
                # e.g. mail.company.com -> mail (maybe not ideal, but simple)
                
                # Let's try to get the main domain part. 
                parts = domain.split(".")
                if len(parts) >= 2:
                    # simplistic: take the part before the last part (TLD)
                    # if 2 parts: google.com -> google
                    # if 3 parts: sub.google.com -> sub (maybe check for known TLDs in future)
                    # For now, let's just capitalize the domain name without TLD.
                    company_part = parts[-2] if len(parts) >= 2 else parts[0]
                    # Handle cases like '.co.uk' where we might want the second to last if we were smarter
                    # But user asked for "last part of the senders email" which is vague, 
                    # usually means the domain.
                    
                    # Re-reading: "Account Name, use the last part of the senders email to deduce this."
                    # I'll interpret "last part" as the domain name.
                    
                    # Let's use the second to last part as the company name usually.
                    company_part = parts[-2]
                    account_name = company_part.replace("-", " ").title()
            else:
                account_name = domain.title()
                
        return account_name, key_contact

crm_service = CRMService()
