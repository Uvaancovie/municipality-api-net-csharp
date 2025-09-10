import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/query-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'eThekwini Municipal Services',
  description: 'Building a better Durban together - Report issues, view events, and track service requests',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}
