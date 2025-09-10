'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportIssue } from '@/components/report-issue'
import { Events } from '@/components/events'
import { Status } from '@/components/status'
import { CreateEvent } from '@/components/create-event'
import { Building2, Calendar, ClipboardList, Plus, FileText } from 'lucide-react'

type View = 'menu' | 'report' | 'events' | 'status' | 'create-event'

export default function HomePage() {
  const [view, setView] = useState<View>('menu')

  if (view === 'report') return <ReportIssue onBack={() => setView('menu')} />
  if (view === 'events') return <Events onBack={() => setView('menu')} />
  if (view === 'status') return <Status onBack={() => setView('menu')} />
  if (view === 'create-event') return <CreateEvent onBack={() => setView('menu')} />

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">eThekwini Municipal Services</h1>
                <p className="text-sm text-gray-600">Building a better Durban together</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Your Voice, Your Community
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Report issues, discover events, and stay informed about your municipal services. 
            Together, we can make Durban a better place for everyone.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setView('report')}>
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Report Issues</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center">
                  Report municipal issues like potholes, water leaks, or broken streetlights
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setView('events')}>
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Events</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center">
                  Discover community events, meetings, and municipal announcements
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setView('create-event')}>
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Create Event</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center">
                  Share community events and announcements with your neighbors
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setView('status')}>
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Track Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center">
                  Check the status of your reported issues and municipal updates
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-center mb-8">Making a Difference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Service Availability</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">Community</div>
              <div className="text-gray-600">Driven Solutions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">Fast</div>
              <div className="text-gray-600">Response Times</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2025 eThekwini Municipality. All rights reserved.
          </p>
          <p className="text-gray-400 mt-2">
            Building a better Durban together, one report at a time.
          </p>
        </div>
      </div>
    </div>
  )
}
