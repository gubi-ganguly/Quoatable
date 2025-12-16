"use client"

import { useState, useEffect } from "react"
import { Loader2, Mail, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthUrlResponse {
  auth_url: string
  session_id: string
}

interface AuthStatusResponse {
    is_authenticated: boolean
    user_email?: string
    message: string
}

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionUser, setSessionUser] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
        const sessionId = localStorage.getItem("session_id")
        if (sessionId) {
            try {
                const response = await fetch("http://localhost:8000/auth/status", {
                    headers: {
                        "X-Session-Id": sessionId
                    }
                })
                const data: AuthStatusResponse = await response.json()
                if (data.is_authenticated && data.user_email) {
                    setSessionUser(data.user_email)
                } else {
                    // Invalid session
                    localStorage.removeItem("session_id")
                }
            } catch (e) {
                console.error("Failed to check session", e)
            }
        }
    }
    checkSession()
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:8000/auth/initiate", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to initiate authentication")
      }

      const data: AuthUrlResponse = await response.json()
      
      // Store session_id (state) temporarily to verify later if needed
      sessionStorage.setItem("pending_session_id", data.session_id)
      
      // Redirect user to Microsoft Login
      window.location.href = data.auth_url
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
      const sessionId = localStorage.getItem("session_id")
      if (sessionId) {
          try {
              await fetch("http://localhost:8000/auth/logout", {
                  method: "POST",
                  headers: { "X-Session-Id": sessionId }
              })
          } catch (e) {
              console.error("Logout error", e)
          }
      }
      localStorage.removeItem("session_id")
      setSessionUser(null)
  }

  if (sessionUser) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                        Logged in as {sessionUser}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button className="w-full" onClick={() => router.push(`/quotable/${encodeURIComponent(sessionUser)}/inbox`)}>
                        Go to Inbox
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Sign in to Quotable</CardTitle>
            <CardDescription>
              Connect your Outlook account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleLogin} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Sign in with Outlook
                  </>
                )}
              </Button>
              {error && (
                <p className="text-sm text-red-500 w-full text-center">{error}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
