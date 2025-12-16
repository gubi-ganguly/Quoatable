import { Email, EmailCard } from "./email-card"

interface EmailListProps {
  emails: Email[]
  onEmailClick?: (email: Email) => void
  selectedEmailId?: string | null
}

export function EmailList({ emails, onEmailClick, selectedEmailId }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">No emails found</p>
          <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
      {emails.map((email) => (
        <EmailCard 
          key={email.id} 
          email={email} 
          onClick={onEmailClick} 
          isSelected={selectedEmailId === email.id}
        />
      ))}
    </div>
  )
}
