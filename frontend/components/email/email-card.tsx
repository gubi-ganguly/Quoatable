import { Paperclip, FileSpreadsheet, FileText, Image as ImageIcon, File } from "lucide-react"
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
  attachments?: Array<{
    id?: string
    name: string
    contentType: string
    size?: number
    isInline?: boolean
  }>
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

function getAttachmentIcon(contentType: string, fileName: string) {
  const lowerName = fileName.toLowerCase()
  
  if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('csv') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
    return <FileSpreadsheet className="h-3 w-3 text-green-600" />
  }
  
  if (contentType.includes('pdf') || lowerName.endsWith('.pdf')) {
    return <FileText className="h-3 w-3 text-red-500" />
  }
  
  if (contentType.includes('image') || lowerName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return <ImageIcon className="h-3 w-3 text-blue-500" />
  }
  
  return <File className="h-3 w-3 text-slate-400" />
}

export function EmailCard({ email, onClick, isSelected }: EmailCardProps) {
  // Handle both snake_case and camelCase from API
  const fromField = email.from || email.from_
  const receivedDateTime = email.receivedDateTime || email.received_datetime || ""
  const isRead = email.isRead ?? email.is_read ?? false
  const hasAttachments = email.hasAttachments ?? email.has_attachments ?? false
  const bodyPreview = email.bodyPreview || email.body_preview || ""
  const attachments = email.attachments || []

  const senderName = fromField?.emailAddress?.name
  const senderAddress = fromField?.emailAddress?.address
  const displayName = senderName || senderAddress || "?"
  const avatarInitial = displayName !== "?" ? displayName.charAt(0).toUpperCase() : "?"

  // Deduplicate icons (e.g. show only one PDF icon even if there are 3 PDFs)
  const uniqueIconTypes = new Set<string>();
  const displayIcons: React.ReactNode[] = [];

  attachments.forEach(att => {
    let type = 'file';
    const lowerName = att.name.toLowerCase();
    const contentType = att.contentType.toLowerCase();

    if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('csv') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) type = 'sheet';
    else if (contentType.includes('pdf') || lowerName.endsWith('.pdf')) type = 'pdf';
    else if (contentType.includes('image') || lowerName.match(/\.(jpg|jpeg|png|gif|webp)$/)) type = 'image';

    if (!uniqueIconTypes.has(type)) {
      uniqueIconTypes.add(type);
      displayIcons.push(getAttachmentIcon(att.contentType, att.name));
    }
  });

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
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Attachment Icons - Left of Date */}
              {displayIcons.length > 0 ? (
                <div className="flex -space-x-1">
                  {displayIcons.map((icon, i) => (
                    <div key={i} className="relative z-10 bg-white dark:bg-slate-950 rounded-full p-0.5 shadow-sm border border-slate-100 dark:border-slate-800">
                      {icon}
                    </div>
                  ))}
                </div>
              ) : hasAttachments && (
                <Paperclip className="h-3 w-3 text-slate-400" />
              )}
              
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(receivedDateTime)}
              </div>
            </div>
          </div>
          
          {bodyPreview && (
            <div className="line-clamp-2 text-xs text-muted-foreground mb-1 leading-relaxed">
              {bodyPreview}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
