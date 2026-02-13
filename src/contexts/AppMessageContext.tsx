'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

export type AppMessageVariant = 'success' | 'error' | 'info'

export interface AppMessageOptions {
  title?: string
  message: string
  variant?: AppMessageVariant
}

interface AppMessageContextValue {
  showMessage: (options: AppMessageOptions) => void
}

const AppMessageContext = createContext<AppMessageContextValue | null>(null)

export function useAppMessage() {
  const ctx = useContext(AppMessageContext)
  if (!ctx) {
    return {
      showMessage: (opts: AppMessageOptions) => {
        // Fallback to alert if used outside provider (e.g. in admin)
        if (typeof window !== 'undefined') window.alert(opts.message)
      }
    }
  }
  return ctx
}

const variantStyles: Record<AppMessageVariant, { icon: typeof CheckCircle; bg: string; iconColor: string; titleColor: string }> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900'
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900'
  },
  info: {
    icon: Info,
    bg: 'bg-primary-50 border-primary-200',
    iconColor: 'text-primary-600',
    titleColor: 'text-primary-900'
  }
}

function AppMessageModal({
  open,
  title,
  message,
  variant = 'info',
  onClose
}: {
  open: boolean
  title?: string
  message: string
  variant: AppMessageVariant
  onClose: () => void
}) {
  if (!open) return null

  const style = variantStyles[variant]
  const Icon = style.icon

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-message-title"
      aria-describedby="app-message-desc"
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full max-w-md min-w-0 rounded-2xl border shadow-xl ${style.bg} bg-white p-6 sm:p-8 my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${style.iconColor} bg-white border-2 border-current/20`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 id="app-message-title" className={`text-lg font-semibold ${style.titleColor} mb-1`}>
              {title ?? (variant === 'success' ? 'Готово' : variant === 'error' ? 'Грешка' : 'Съобщение')}
            </h2>
            <p id="app-message-desc" className="text-secondary-600 text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary min-w-[120px]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppMessageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    open: boolean
    title?: string
    message: string
    variant: AppMessageVariant
  }>({
    open: false,
    message: '',
    variant: 'info'
  })

  const showMessage = useCallback((options: AppMessageOptions) => {
    setState({
      open: true,
      title: options.title,
      message: options.message,
      variant: options.variant ?? 'info'
    })
  }, [])

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])

  return (
    <AppMessageContext.Provider value={{ showMessage }}>
      {children}
      <AppMessageModal
        open={state.open}
        title={state.title}
        message={state.message}
        variant={state.variant}
        onClose={close}
      />
    </AppMessageContext.Provider>
  )
}
