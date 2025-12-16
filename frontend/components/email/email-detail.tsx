"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Download, File, Loader2, Mail, Paperclip, Reply, ReplyAll, Forward, MoreVertical } from "lucide-react"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Email } from "./email-card"
import { cn } from "@/lib/utils"

interface Attachment {
  id?: string
  name: string
  contentType: string
  size: number
  isInline: boolean
  contentBytes?: string
}

interface EmailDetailProps {
  email: Email
  onClose?: () => void
}

export function EmailDetail({ email, onClose }: EmailDetailProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine if we need to fetch attachments
  const shouldFetchAttachments = (email.hasAttachments || email.has_attachments) && attachments.length === 0

  useEffect(() => {
    // Reset state when email changes
    setAttachments([])
    setError(null)
    
    const fetchAttachments = async () => {
      if (!email.id || !((email.hasAttachments || email.has_attachments))) return

      setIsLoadingAttachments(true)
      const sessionId = localStorage.getItem("session_id")
      
      try {
        const response = await axios.get<Attachment[]>(`/api/email/${email.id}/attachments`, {
          headers: {
            "X-Session-Id": sessionId
          }
        })
        setAttachments(response.data)
      } catch (err) {
        console.error("Error fetching attachments:", err)
        setError("Failed to load attachments")
      } finally {
        setIsLoadingAttachments(false)
      }
    }

    fetchAttachments()
  }, [email.id, email.hasAttachments, email.has_attachments])

  const fromField = email.from || email.from_
  const senderName = fromField?.emailAddress?.name
  const senderAddress = fromField?.emailAddress?.address
  const displayName = senderName || senderAddress || "?"
  const avatarInitial = displayName !== "?" ? displayName.charAt(0).toUpperCase() : "?"

  const receivedDate = new Date(email.receivedDateTime || email.received_datetime || "")
  const formattedDate = !isNaN(receivedDate.getTime()) 
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(receivedDate)
    : ""

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle body content - prefer HTML content if available
  const bodyContent = email.body?.content || email.bodyPreview || email.body_preview || "No content"
  const isHtml = email.body?.contentType === 'html'

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden min-h-0">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {email.subject || "(No Subject)"}
          </h2>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <Reply className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <ReplyAll className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <Forward className="h-4 w-4" />
             </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Avatar Replacement */}
          <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
             {avatarInitial}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {senderName || senderAddress}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                &lt;{senderAddress}&gt;
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
               <span>To: You</span>
               <span>•</span>
               <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      {(email.hasAttachments || email.has_attachments) && (
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Paperclip className="h-4 w-4" />
            <span>Attachments {attachments.length > 0 && `(${attachments.length})`}</span>
          </div>
          
          {isLoadingAttachments ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading attachments...
            </div>
          ) : attachments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div 
                  key={att.id || att.name} 
                  className="group flex items-center gap-3 p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer max-w-[240px]"
                >
                  <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <File className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={att.name}>
                      {att.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(att.size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : null}
        </div>
      )}

      {/* Email Body - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6">
          <div className={cn("prose prose-slate dark:prose-invert max-w-none break-words")}>
             {isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
             ) : (
                <div className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
                  {bodyContent}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
