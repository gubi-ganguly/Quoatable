"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownOption {
  label: string
  value: string | null
  icon?: React.ReactNode
}

interface DropdownProps {
  options: DropdownOption[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

export function Dropdown({ options, value, onChange, placeholder = "Select...", className }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Find the selected option
  const selectedOption = options.find(opt => opt.value === value) || options[0]

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700",
          "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700",
          "text-sm font-medium text-slate-700 dark:text-slate-300",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          "whitespace-nowrap"
        )}
      >
        {selectedOption.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
        <span>{selectedOption.label}</span>
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-slate-500 transition-transform flex-shrink-0",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                  "hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
                  value === option.value && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                )}
              >
                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
