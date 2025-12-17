import { Loader2, AlertCircle, CheckCircle2, Package, Sparkles, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Product {
  name?: string
  quantity?: number
  partNumber?: string
  partNumberType?: "CESS" | "MPN"
  description?: string
}

export interface AnalysisResult {
  is_customer_request: boolean
  confidence: number
  reasoning: string
  products: Product[]
  opportunityName?: string
  accountName?: string
  keyContact?: string
}

interface EmailOpportunityProps {
  result: AnalysisResult | null
  isLoading: boolean
  error: string | null
  onClose?: () => void
}

export function EmailOpportunity({ result, isLoading, error, onClose }: EmailOpportunityProps) {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg">
            <Sparkles className="h-8 w-8 text-blue-500 animate-pulse" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Analyzing Email</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Extracting insights and products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Analysis Failed</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto">{error}</p>
        </div>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Opportunity</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <span className="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-5 w-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Badge variant={result.is_customer_request ? "default" : "secondary"} className={cn(
            result.is_customer_request ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" : ""
          )}>
            {result.is_customer_request ? "Customer Request" : "General Email"}
          </Badge>
          <span className="text-xs font-medium text-slate-500">
            {Math.round(result.confidence * 100)}% confidence
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 space-y-6">
          {/* CRM Details */}
          {(result.opportunityName || result.accountName) && (
             <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                   <Briefcase className="h-4 w-4 text-slate-500" />
                   Salesforce Details
                </h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-3">
                   {result.opportunityName && (
                      <div className="space-y-1">
                         <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Opportunity Name</div>
                         <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{result.opportunityName}</div>
                      </div>
                   )}
                   <div className="grid grid-cols-2 gap-4">
                      {result.accountName && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Account</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">{result.accountName}</div>
                        </div>
                      )}
                      {result.keyContact && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Key Contact</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">{result.keyContact}</div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          )}

          {/* Reasoning */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-slate-500" />
              Analysis
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              {result.reasoning}
            </p>
          </div>

          {/* Products */}
          {result.products && result.products.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500" />
                Extracted Products ({result.products.length})
              </h3>
              <div className="space-y-3">
                {result.products.map((product, idx) => (
                  <Card key={idx} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {product.name || "Unknown Product"}
                        </div>
                        {product.quantity && (
                          <Badge variant="outline" className="text-xs h-5 shrink-0 bg-white dark:bg-slate-800">
                            Qty: {product.quantity}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 text-xs space-y-2">
                      {product.partNumber && (
                        <div className="flex gap-2">
                          <span className="text-slate-500 font-medium">
                            {product.partNumberType === "CESS" ? "CESS #:" : "MPN:"}
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 select-all">{product.partNumber}</span>
                        </div>
                      )}
                      {product.description && (
                        <div className="text-slate-600 dark:text-slate-400 line-clamp-2">
                          {product.description}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {result.is_customer_request && (!result.products || result.products.length === 0) && (
            <div className="p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <p className="text-sm text-slate-500">No specific product details extracted.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Create Opportunity Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md transition-all disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:from-slate-300 disabled:hover:to-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
          disabled={!result.products || result.products.length === 0}
          onClick={() => {
            // Placeholder - does nothing for now
          }}
        >
          Create Opportunity
        </Button>
      </div>
    </div>
  )
}
