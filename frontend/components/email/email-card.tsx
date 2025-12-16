import { Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Email {
  id: string
  subject: string | null
  bodyPreview?: string | null
  body_preview?: string | null
  body?: {
    contentType: string
    content: string
  } | null
  from?: {
    emailAddress: {
      address: string
      name: string | null
    }
  } | null
  from_?: {
    emailAddress: {
      address: string
      name: string | null
    }
  } | null
  receivedDateTime?: string
  received_datetime?: string
  isRead?: boolean
  is_read?: boolean
  hasAttachments?: boolean
  has_attachments?: boolean
  importance: string
  toRecipients?: Array<{ emailAddress: { address: string, name: string | null } }>
  ccRecipients?: Array<{ emailAddress: { address: string, name: string | null } }>
  to_recipients?: Array<{ emailAddress: { address: string, name: string | null } }>
  cc_recipients?: Array<{ emailAddress: { address: string, name: string | null } }>
}

interface EmailCardProps {
  email: Email
  onClick?: (email: Email) => void
  isSelected?: boolean
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return ""
  }
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

export function EmailCard({ email, onClick, isSelected }: EmailCardProps) {
  // Handle both snake_case and camelCase from API
  const fromField = email.from || email.from_
  const receivedDateTime = email.receivedDateTime || email.received_datetime || ""
  const isRead = email.isRead ?? email.is_read ?? false
  const hasAttachments = email.hasAttachments ?? email.has_attachments ?? false
  const bodyPreview = email.bodyPreview || email.body_preview || ""

  const senderName = fromField?.emailAddress?.name
  const senderAddress = fromField?.emailAddress?.address
  const displayName = senderName || senderAddress || "?"
  const avatarInitial = displayName !== "?" ? displayName.charAt(0).toUpperCase() : "?"

  return (
    <div
      className={cn(
        "group cursor-pointer transition-all duration-200 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent hover:border-blue-500",
        isSelected && "bg-blue-50 dark:bg-blue-900/20 border-l-blue-500",
        !isRead && !isSelected && "bg-blue-50/50 dark:bg-blue-950/20 border-l-blue-500"
      )}
      onClick={() => onClick?.(email)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar Circle */}
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm transition-all group-hover:scale-105",
          !isRead ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-slate-400 to-slate-500"
        )}>
          {avatarInitial}
        </div>

        {/* Email Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn(
                  "font-semibold text-sm truncate",
                  !isRead ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                )}>
                  {senderName || senderAddress || "Unknown Sender"}
                </span>
                {!isRead && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0"></span>
                )}
              </div>
              <div className={cn(
                "text-sm font-medium mb-1 line-clamp-1",
                !isRead ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"
              )}>
                {email.subject || "(No Subject)"}
              </div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {formatDate(receivedDateTime)}
            </div>
          </div>
          
          {bodyPreview && (
            <div className="line-clamp-2 text-xs text-muted-foreground mb-1 leading-relaxed">
              {bodyPreview}
            </div>
          )}
          
          {hasAttachments && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              <span className="font-medium">Attachment</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
