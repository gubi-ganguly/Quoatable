"use client"

import { useEffect, useState, use } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  ChevronDown,
  Search,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/layout/navbar"

// Interfaces
interface Product {
  name?: string
  quantity?: number
  partNumber?: string
  partNumberType?: "CESS" | "MPN"
  description?: string
  // UI specific fields for this page
  status?: "QUOTABLE" | "VENDOR_QUOTE" | "NOT_QUOTABLE"
  vendor?: string
  unitPrice?: number
  totalPrice?: number
}

interface Opportunity {
  oid: string
  opportunityName?: string
  accountName?: string
  keyContact?: string
  products?: Product[]
  status?: string
}

// Wizard Steps Configuration
const STEPS = [
  { id: 1, title: "Classification", subtitle: "Phase 1", status: "active" },
  { id: 2, title: "Vendor Outreach", subtitle: "Phase 2", status: "pending" },
  { id: 3, title: "Vendor Portal", subtitle: "Phase 3", status: "pending" },
  { id: 4, title: "Quote Builder", subtitle: "Phase 4", status: "pending" },
]

export default function Phase1Classification() {
  const params = useParams()
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch Opportunity Data
  useEffect(() => {
    const fetchOpportunity = async () => {
      if (!params.oid) return

      try {
        const response = await axios.get(`/api/crm/opportunity/${params.oid}`)
        setOpportunity(response.data)
      } catch (err) {
        console.error("Failed to fetch opportunity:", err)
        setError("Failed to load opportunity data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOpportunity()
  }, [params.oid])

  const handleBackToInbox = () => {
    if (params.uid) {
      router.push(`/quotable/${params.uid}/inbox`)
    } else {
      router.back()
    }
  }

  // Calculate summary stats
  const totalItems = opportunity?.products?.length || 0
  const quotableItems = opportunity?.products?.length || 0 // Default all to quotable for now
  const vendorQuoteItems = 0
  const notQuotableItems = 0
  const estQuoteValue = 0 // Placeholder

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-[#04A6E1]"></div>
      </div>
    )
  }

  if (error) {
     return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
           <div className="text-red-500 flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              <span>{error}</span>
           </div>
           <Button onClick={handleBackToInbox} variant="outline">Back to Inbox</Button>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      
      {/* Top Navigation / Stepper */}
      <div className="text-white py-8 px-6" style={{ backgroundColor: '#35455c' }}>
        <div className="max-w-7xl mx-auto">
          {/* Stepper */}
          <div className="flex justify-center items-center gap-4">
             {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                   <div className="flex flex-col items-center relative z-10">
                      <div className={cn(
                         "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all",
                         step.status === "completed" ? "bg-green-500 border-green-500 text-white" :
                         step.status === "active" ? "bg-[#04A6E1] border-[#04A6E1] text-white shadow-[0_0_20px_rgba(4,166,225,0.4)]" :
                         "bg-slate-700/30 border-slate-400 text-slate-200"
                      )}>
                         {step.status === "completed" ? <CheckCircle2 className="h-6 w-6" /> : step.id}
                      </div>
                      <div className="mt-3 text-center w-32">
                         <div className={cn("text-sm font-bold mb-0.5", step.status === "active" ? "text-white" : "text-slate-200")}>{step.title}</div>
                         <div className={cn("text-[10px] uppercase tracking-widest font-medium", step.status === "active" ? "text-slate-200" : "text-slate-300")}>{step.subtitle}</div>
                      </div>
                   </div>
                   {index < STEPS.length - 1 && (
                      <div className={cn(
                         "h-0.5 w-24 -mt-10 mx-4",
                         step.status === "completed" ? "bg-green-500" : "bg-slate-500/50"
                      )} />
                   )}
                </div>
             ))}
          </div>
        </div>
          </div>

      {/* Page Header & Opportunity Card */}
      <div className="bg-white px-6 pt-10 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 relative">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 tracking-tight text-slate-900">Phase 1: Automated Equipment List Processing</h1>
                        <p className="text-slate-500 text-lg">Review processed equipment items, validate pricing, and manage vendor quote requests.</p>
                    </div>
              <button 
                onClick={handleBackToInbox}
                        className="flex items-center text-slate-500 hover:text-[#04A6E1] transition-colors text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </button>
                </div>
            </div>

            {/* Opportunity Summary Card */}
            <Card className="bg-slate-900 text-white p-8 shadow-xl rounded-xl border-slate-800">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div>
                   <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Project/Opportunity Name</div>
                   <div className="font-bold text-xl truncate">{opportunity?.opportunityName || "Untitled Opportunity"}</div>
                </div>
                <div>
                   <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Key Contact</div>
                   <div className="font-bold text-xl truncate">{opportunity?.keyContact || opportunity?.accountName || "Unknown Contact"}</div>
                </div>
                <div>
                   <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Total Items</div>
                   <div className="font-bold text-3xl">{totalItems}</div>
                </div>
                <div>
                   <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Est Quote Value</div>
                   <div className="font-bold text-3xl text-green-400">
                      {estQuoteValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-8 border-t border-slate-800 pt-8">
                <div>
                   <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Quotable Items</div>
                   <div className="font-bold text-2xl text-green-400">{quotableItems}</div>
                </div>
                <div>
                   <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Need Vendor Quote</div>
                   <div className="font-bold text-2xl text-orange-400">{vendorQuoteItems}</div>
                </div>
                <div>
                   <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Not Quotable</div>
                   <div className="font-bold text-2xl text-red-400">{notQuotableItems}</div>
                </div>
             </div>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white px-6 pb-20 relative z-20">
          <div className="max-w-7xl mx-auto">
         {/* Action Bar */}
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
               <Button className="bg-green-600 hover:bg-green-700 text-white border-none shadow-md h-10 px-6 font-medium">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve all Quotable Items
               </Button>
               <Button className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-md h-10 px-6 font-medium">
                  <Search className="h-4 w-4 mr-2" />
                  Request all Vendor Quotes
               </Button>
               <Button variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600 border-none shadow-md h-10 px-6 font-medium">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Review all Flagged Items
               </Button>
            </div>
            
            <div className="flex items-center gap-3">
               <Button className="bg-[#04A6E1] hover:bg-[#0388B9] text-white shadow-md h-10 px-6 font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line Item
               </Button>
               <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm h-10 px-6 font-medium">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
               </Button>
            </div>
         </div>

         {/* Data Table */}
         <Card className="overflow-hidden shadow-xl border-slate-200 bg-white rounded-xl">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-white uppercase bg-slate-900 border-b border-slate-800">
                     <tr>
                        <th className="px-3 py-5 font-semibold tracking-wider w-28">Status</th>
                        <th className="px-3 py-5 font-semibold tracking-wider w-32">SKU/MPN</th>
                        <th className="px-3 py-5 font-semibold tracking-wider w-40">Model Name</th>
                        <th className="px-3 py-5 font-semibold tracking-wider w-36">Description</th>
                        <th className="px-3 py-5 font-semibold tracking-wider w-32">Vendor</th>
                        <th className="px-3 py-5 font-semibold tracking-wider text-right w-28">Unit Price</th>
                        <th className="px-3 py-5 font-semibold tracking-wider text-center w-24">Quantity</th>
                        <th className="px-3 py-5 font-semibold tracking-wider text-right w-32">Total Price</th>
                        <th className="px-3 py-5 font-semibold tracking-wider text-center w-32">Action</th>
                        <th className="px-3 py-5 font-semibold tracking-wider text-center w-32">Alternatives</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                     {opportunity?.products?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                           <td className="px-3 py-4">
                              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 font-semibold border-none px-2 py-1 rounded-md text-xs">
                                 QUOTABLE <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                              </Badge>
                           </td>
                           <td className="px-3 py-4 font-mono text-slate-500 text-xs">
                              {item.partNumber || "-"}
                           </td>
                           <td className="px-3 py-4 font-semibold text-slate-900 text-sm truncate max-w-[160px]" title={item.name}>
                              {item.name || "Unknown Model"}
                           </td>
                           <td className="px-3 py-4 text-slate-600 text-xs truncate max-w-[144px]" title={item.description}>
                              {item.description || "-"}
                           </td>
                           <td className="px-3 py-4 text-slate-500 text-sm truncate max-w-[128px]">
                              {item.vendor || "Unknown"}
                           </td>
                           <td className="px-3 py-4 text-right font-medium text-slate-700 text-sm">
                              {item.unitPrice ? `$${item.unitPrice.toLocaleString()}` : "-"}
                           </td>
                           <td className="px-3 py-4 text-center font-medium text-slate-700 text-sm">
                              {item.quantity || 1}
                           </td>
                           <td className="px-3 py-4 text-right font-bold text-slate-900 text-sm">
                              {item.totalPrice ? `$${item.totalPrice.toLocaleString()}` : "-"}
                           </td>
                           <td className="px-3 py-4 text-center">
                              <Button size="sm" className="h-8 bg-[#04A6E1] hover:bg-[#0388B9] text-white text-xs px-3 font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                 Add to Quote
                              </Button>
                           </td>
                           <td className="px-3 py-4 text-center">
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-[#04A6E1] transition-colors">
                                 <Plus className="h-3 w-3" />
                              </Button>
                           </td>
                        </tr>
                     ))}
                     {(!opportunity?.products || opportunity.products.length === 0) && (
                        <tr>
                           <td colSpan={10} className="px-3 py-16 text-center text-slate-400">
                              <div className="flex flex-col items-center gap-2">
                                 <Search className="h-8 w-8 text-slate-300" />
                                 <p>No products found in this opportunity.</p>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </Card>
          </div>
      </div>
    </div>
  )
}
