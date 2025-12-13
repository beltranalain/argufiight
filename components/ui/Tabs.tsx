'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content?: React.ReactNode
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  activeTab?: string
  onTabChange?: (tabId: string) => void
  onChange?: (tabId: string) => void // Legacy support
}

export function Tabs({ tabs, defaultTab, activeTab: controlledActiveTab, onTabChange, onChange }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id)
  
  // Use controlled activeTab if provided, otherwise use internal state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab

  const handleTabChange = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId)
    }
    onTabChange?.(tabId)
    onChange?.(tabId) // Legacy support
  }

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div>
      {/* Tab Headers */}
      <div className="border-b border-bg-tertiary">
        <div className="flex gap-1 relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative px-4 py-3 font-medium transition-colors flex items-center gap-2',
                activeTab === tab.id
                  ? 'text-electric-blue'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {tab.icon}
              {tab.label}
              
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-blue"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content - Only render if content is provided */}
      {activeTabContent && (
        <div className="p-6 max-w-full overflow-hidden [&_img]:max-w-full [&_img]:h-auto [&_img]:object-contain">
          {activeTabContent}
        </div>
      )}
    </div>
  )
}

