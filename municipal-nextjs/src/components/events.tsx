'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingProgress, CardSkeleton } from '@/components/loading-progress'
import { CreateEvent } from '@/components/create-event'
import { apiClient, eventCategoryNames, type EventDto } from '@/lib/api'
import { ArrowLeft, Calendar, MapPin, RefreshCw, AlertCircle, Plus } from 'lucide-react'

interface EventsProps {
  onBack: () => void
}

export function Events({ onBack }: EventsProps) {
  const [showCreateEvent, setShowCreateEvent] = useState(false)

  // Use React Query for events data fetching
  const {
    data: events = [],
    isLoading: loading,
    error,
    refetch: loadEvents
  } = useQuery({
    queryKey: ['events'],
    queryFn: () => apiClient.getEvents(),
    staleTime: 60000, // 1 minute cache for events
    refetchOnWindowFocus: false,
  })

  if (showCreateEvent) {
    return (
      <CreateEvent 
        onBack={() => setShowCreateEvent(false)}
        onSuccess={() => {
          loadEvents()
          setShowCreateEvent(false)
        }}
      />
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  const upcomingEvents = events.filter(event => isUpcoming(event.startsAt))
  const pastEvents = events.filter(event => isPast(event.startsAt))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Local Events & Announcements</h1>
                <p className="text-sm text-gray-600">Stay informed about community events</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowCreateEvent(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline" onClick={() => loadEvents()} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        <LoadingProgress isLoading={loading} className="h-1" />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error: {error?.message || 'Unknown error'}</span>
              </div>
              <Button onClick={() => loadEvents()} className="mt-3" variant="outline" size="sm">
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Events Content */}
        {!loading && !error && (
          <div className="space-y-8">
            {/* Upcoming Events */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Upcoming Events ({upcomingEvents.length})
                </h2>
              </div>

              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming events scheduled.</p>
                    <p className="text-sm text-gray-400">Check back later for updates.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingEvents.map(event => (
                    <Card key={event.id} className="border-green-200 bg-green-50/50 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-900">{event.title}</CardTitle>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(event.startsAt)}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Upcoming
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-700">{event.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Past Events */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Past Events ({pastEvents.length})
                </h2>
              </div>

              {pastEvents.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500">No past events to display.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pastEvents.slice(0, 5).map(event => (
                    <Card key={event.id} className="bg-gray-50 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-700">{event.title}</CardTitle>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(event.startsAt)}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                            Past
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-600">{event.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {pastEvents.length > 5 && (
                    <Card className="border-dashed">
                      <CardContent className="pt-6 text-center">
                        <p className="text-sm text-gray-500">
                          ... and {pastEvents.length - 5} more past events
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </section>

            {/* All Events Empty State */}
            {events.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events available</h3>
                  <p className="text-gray-500 mb-6">
                    Check back later for updates on local events and announcements.
                  </p>
                  <Button onClick={() => loadEvents()} variant="outline">
                    Check for Updates
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
