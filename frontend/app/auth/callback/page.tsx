"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface AuthStatusResponse {
  is_authenticated: boolean
  user_email?: string
  message: string
}

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Completing authentication...")

  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state") // session_id

    if (!code || !state) {
      setStatus("error")
      setMessage("Missing authentication parameters")
      return
    }

    const completeAuth = async () => {
      try {
        const response = await fetch("http://localhost:8000/auth/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            session_id: state,
          }),
        })

        const data: AuthStatusResponse = await response.json()

        if (response.ok && data.is_authenticated) {
            setStatus("success")
            setMessage(`Successfully logged in as ${data.user_email}`)
            
            // Store session in localStorage (in a real app, use secure cookies or context)
            localStorage.setItem("session_id", state)
            
            // Redirect after a short delay
            setTimeout(() => {
                // In a real app, redirect to dashboard
                // router.push("/dashboard")
                // For now, redirect back to home to see status
                router.push(`/quotable/${encodeURIComponent(data.user_email || "user")}/inbox`)
            }, 2000)
        } else {
            throw new Error(data.message || "Authentication failed")
        }
      } catch (err) {
        setStatus("error")
        setMessage(err instanceof Error ? err.message : "An error occurred")
      }
    }

    completeAuth()
  }, [searchParams, router])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        {status === "loading" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}
        {status === "success" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
        )}
        {status === "error" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
        )}
        <CardTitle>
            {status === "loading" && "Authenticating"}
            {status === "success" && "Success"}
            {status === "error" && "Authentication Failed"}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
          {status === "success" && (
              <p className="text-sm text-muted-foreground">Redirecting you...</p>
          )}
          {status === "error" && (
              <button 
                  onClick={() => router.push("/")}
                  className="mt-4 text-sm text-primary hover:underline"
              >
                  Return to Login
              </button>
          )}
      </CardContent>
    </Card>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <Suspense fallback={<div>Loading...</div>}>
        <CallbackContent />
      </Suspense>
    </div>
  )
}
