"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Inbox, Send, FileText, Trash2, Archive, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  uid: string
}

export function AppSidebar({ uid }: AppSidebarProps) {
  const pathname = usePathname()
  const baseUrl = `/quotable/${encodeURIComponent(uid)}`

  const navItems = [
    { name: "Inbox", href: `${baseUrl}/inbox`, icon: Inbox },
    { name: "Sent", href: `${baseUrl}/sent`, icon: Send },
    { name: "Drafts", href: `${baseUrl}/drafts`, icon: FileText },
    { name: "Archive", href: `${baseUrl}/archive`, icon: Archive },
    { name: "Trash", href: `${baseUrl}/trash`, icon: Trash2 },
  ]

  const handleLogout = () => {
     // We'll implement the logout logic call here or pass it down
     localStorage.removeItem("session_id")
     window.location.href = "/"
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-zinc-50/40 dark:bg-zinc-900/40">
      <div className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">Quotable</h2>
      </div>
      <div className="flex-1 px-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  pathname === item.href && "bg-secondary text-secondary-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 mt-auto border-t">
        <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            onClick={handleLogout}
        >
            <LogOut className="h-4 w-4" />
            Sign Out
        </Button>
      </div>
    </div>
  )
}
