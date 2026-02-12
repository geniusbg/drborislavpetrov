'use client'

import React from 'react'
import { AppMessageProvider } from '@/contexts/AppMessageContext'

function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppMessageProvider>{children}</AppMessageProvider>
}

export { ClientProviders }
export default ClientProviders
