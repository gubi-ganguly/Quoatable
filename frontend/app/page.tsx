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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/50 p-4">
      {/* Logo and Titles */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-6 h-12 w-48">
            <img 
                src="/assets/cme-logo.png" 
                alt="CME Corp" 
                className="object-contain"
            />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
            Quote Automation System
        </h1>
        <p className="text-lg text-slate-500">
            Streamline your equipment quote generation process
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="border-slate-200 bg-white shadow-xl">
          <CardHeader className="space-y-1 pt-8 text-center">
            <CardTitle className="text-xl font-bold">Login with CME</CardTitle>
            <CardDescription className="text-slate-500">
              Use your CME Corp credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8 pt-4">
            <div className="space-y-4 px-4">
              <Button 
                className="w-full bg-[#04A6E1] text-lg font-medium hover:bg-[#0388B9]" 
                size="lg" 
                onClick={handleLogin} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Sign In with Outlook
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
      
      <div className="mt-8 text-center text-sm text-slate-400">
        <p>© 2025 CME Corp. All rights reserved.</p>
        <p>Secure quote automation for equipment processing</p>
      </div>
    </div>
  )
}
