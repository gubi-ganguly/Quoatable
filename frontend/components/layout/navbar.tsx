"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Bell, LayoutDashboard } from "lucide-react"

export function Navbar() {
  const params = useParams()
  const uid = params?.uid ? decodeURIComponent(params.uid as string) : "JD"

  const getInitials = (str: string) => {
    if (str === "JD") return "JD"
    // Remove domain if present
    const namePart = str.includes("@") ? str.split("@")[0] : str
    
    // Split by dot, underscore, hyphen or space
    const parts = namePart.split(/[\.\_\-\s]+/)
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return namePart.substring(0, 2).toUpperCase()
  }

  const initials = getInitials(uid)

  return (
    <nav className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-24">
                <Image 
                    src="/assets/cme-logo.png" 
                    alt="CME Corp Logo" 
                    fill
                    className="object-contain object-left"
                    priority
                />
            </div>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Link 
            href="#" 
            className="flex items-center gap-2 text-slate-600 hover:text-[#04A6E1] transition-colors text-sm font-medium"
        >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
        </Link>
        
        <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                3
            </span>
        </button>

        <div 
            className="h-8 w-8 rounded-full bg-[#04A6E1] text-white flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer hover:bg-[#0388B9] transition-colors"
            title={uid !== "JD" ? uid : "User Profile"}
        >
            {initials}
        </div>
      </div>
    </nav>
  )
}
