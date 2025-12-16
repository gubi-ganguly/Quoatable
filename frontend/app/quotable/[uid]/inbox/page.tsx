"use client"

import { useEffect, useState, use, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, X, ChevronLeft, Mail, Calendar, Clock, Filter, RefreshCw } from "lucide-react"
import axios from "axios"

import { EmailList } from "@/components/email/email-list"
import { Email } from "@/components/email/email-card"
import { EmailDetail } from "@/components/email/email-detail"
import { EmailOpportunity, AnalysisResult } from "@/components/email/email-opportunity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dropdown } from "@/components/ui/dropdown"

interface InboxPageProps {
  params: Promise<{
    uid: string
  }>
}

interface EmailsResponse {
  emails: Email[]
  count: number
}

const ITEMS_PER_PAGE = 25

export default function InboxPage({ params }: InboxPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [emails, setEmails] = useState<Email[]>([])
  const [isLoading, setIsLoading] = useState(true) // Initial load
  const [isLoadingMore, setIsLoadingMore] = useState(false) // Infinite scroll load
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Pagination state
  const [skip, setSkip] = useState(0)
  
  // Analysis state
  const [showOpportunity, setShowOpportunity] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  
  // Observer for infinite scroll
  const observerTarget = useRef(null)

  const fetchEmails = useCallback(async (isLoadMore: boolean = false) => {
    // Prevent multiple simultaneous fetches or unnecessary fetches
    if (!isLoadMore) setIsLoading(true)
    else setIsLoadingMore(true)

    const sessionId = localStorage.getItem("session_id")
    
    if (!sessionId) {
      router.push("/")
      return
    }

    try {
      const params: Record<string, string> = {
        limit: ITEMS_PER_PAGE.toString(),
        skip: skip.toString()
      }
      
      if (activeSearch) {
        params.search = activeSearch
      }

      if (dateFilter) {
          params.date_filter = dateFilter
      }

      const response = await axios.get<EmailsResponse>("/api/email", {
        params,
        headers: {
          "X-Session-Id": sessionId
        }
      })

      const data = response.data
      const newEmails = data.emails || []
      
      if (newEmails.length < ITEMS_PER_PAGE) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }

      if (skip === 0) {
        setEmails(newEmails)
      } else {
        setEmails(prev => [...prev, ...newEmails])
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
             localStorage.removeItem("session_id")
             router.push("/")
             return
        }
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : "An error occurred")
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [activeSearch, dateFilter, skip, router])

  useEffect(() => {
    fetchEmails(skip > 0)
  }, [fetchEmails, skip, refreshKey]) // fetchEmails dependency includes other state

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setSkip((prev) => prev + ITEMS_PER_PAGE)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, isLoading, isLoadingMore])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchQuery)
    setSkip(0) // Reset to first page
    setSelectedEmail(null) // Clear selection on search
    setHasMore(true)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setActiveSearch("")
    setSkip(0)
    setSelectedEmail(null)
    setHasMore(true)
  }

  const filters = [
    { label: "All", value: null, icon: <Filter className="h-3.5 w-3.5" /> },
    { label: "Today", value: "today", icon: <Clock className="h-3.5 w-3.5" /> },
    { label: "This Week", value: "this_week", icon: <Calendar className="h-3.5 w-3.5" /> },
    { label: "Unread", value: "unread_only", icon: <Mail className="h-3.5 w-3.5" /> },
  ]

  const handleFilterClick = (value: string | null) => {
      setDateFilter(value)
      setSkip(0)
      setSelectedEmail(null)
      setHasMore(true)
  }

  const handleRefresh = () => {
    setSelectedEmail(null)
    setHasMore(true)
    setSkip(0)
    setEmails([])
    setShowOpportunity(false)
    setAnalysisResult(null)
    // Increment refresh key to force useEffect to trigger
    setRefreshKey(prev => prev + 1)
  }

  const handleAnalyzeEmail = async () => {
    if (!selectedEmail) return

    setShowOpportunity(true)
    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    const sessionId = localStorage.getItem("session_id")
    
    try {
      const response = await axios.post<AnalysisResult>(
        `/api/email/${selectedEmail.id}/analyze`,
        {},
        {
           headers: { "X-Session-Id": sessionId }
        }
      )
      console.log("Analysis Result:", response.data)
      setAnalysisResult(response.data)
    } catch (err) {
      console.error("Analysis failed:", err)
      setAnalysisError("Failed to analyze email. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Close opportunity panel when email is unselected
  useEffect(() => {
    if (!selectedEmail) {
      setShowOpportunity(false)
      setAnalysisResult(null)
    }
  }, [selectedEmail])

  // Decode the UID for display
  const displayUid = decodeURIComponent(resolvedParams.uid)

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      {/* Header Section */}
      <header className="flex-none border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm z-10">
        <div className="mx-auto w-full px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Title and Search Row */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    Inbox
                  </h1>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{displayUid}</p>
                </div>
              </div>
              
              {/* Enhanced Search Bar */}
              <form onSubmit={handleSearch} className="flex w-full max-w-md items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search emails..." 
                    className="pl-9 pr-8 h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-sm" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Button 
                  type="submit" 
                  size="sm"
                  className="h-9 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md transition-all"
                >
                  Search
                </Button>
              </form>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 w-full max-w-[1920px] mx-auto px-4 py-4 lg:px-6">
        {error && (
          <Card className="mb-4 border-destructive/50 bg-destructive/10 shadow-lg">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <X className="h-4 w-4" />
                Error Loading Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-sm text-muted-foreground font-medium">Loading your emails...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-full bg-white dark:bg-slate-900 shadow-xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* List View */}
            <div className={`col-span-1 lg:col-span-4 flex flex-col border-r border-slate-200 dark:border-slate-800 h-full min-h-0 ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
              {/* Mini Navbar */}
              <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <Dropdown
                  options={filters}
                  value={dateFilter}
                  onChange={handleFilterClick}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading || isLoadingMore}
                  className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  title="Refresh emails"
                >
                  <RefreshCw className={`h-4 w-4 ${(isLoading || isLoadingMore) ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0">
                <EmailList 
                  emails={emails} 
                  onEmailClick={(email) => setSelectedEmail(email)}
                  selectedEmailId={selectedEmail?.id}
                />
                
                {/* Infinite Scroll Loader / Sentinel */}
                <div ref={observerTarget} className="h-8 flex items-center justify-center py-4 text-xs text-muted-foreground">
                  {isLoadingMore && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading more...
                    </div>
                  )}
                  {!hasMore && emails.length > 0 && "No more emails"}
                </div>
              </div>
            </div>

            {/* Detail View */}
            <div className={`col-span-1 min-h-0 bg-slate-50/30 dark:bg-slate-900/30 ${
                !selectedEmail ? 'hidden lg:block lg:col-span-8' : 
                showOpportunity ? 'lg:col-span-5' : 'lg:col-span-8'
            }`}>
              {selectedEmail ? (
                <div className="h-full flex flex-col min-h-0">
                    {/* Mobile Back Button */}
                    <div className="lg:hidden p-2 border-b border-slate-200 dark:border-slate-800 flex items-center bg-white dark:bg-slate-900 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)} className="gap-1">
                            <ChevronLeft className="h-4 w-4" />
                            Back to list
                        </Button>
                    </div>
                    <div className="flex-1 min-h-0">
                      <EmailDetail 
                        email={selectedEmail} 
                        onClose={() => setSelectedEmail(null)} 
                        onAnalyze={handleAnalyzeEmail}
                        isAnalyzing={isAnalyzing}
                      />
                    </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <Mail className="h-10 w-10 opacity-30 text-slate-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Select an email to read</p>
                    <p className="text-sm text-slate-400">Choose from the list on the left</p>
                  </div>
                </div>
              )}
            </div>

            {/* Opportunity View */}
            {showOpportunity && selectedEmail && (
              <div className="hidden lg:block lg:col-span-3 h-full min-h-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-in slide-in-from-right-4 duration-200">
                <EmailOpportunity 
                  result={analysisResult} 
                  isLoading={isAnalyzing} 
                  error={analysisError}
                  onClose={() => setShowOpportunity(false)}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
