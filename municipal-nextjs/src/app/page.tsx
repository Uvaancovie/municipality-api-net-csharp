'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NavBar } from '@/components/navbar'
import { ReportIssue } from '@/components/report-issue'
import { Events } from '@/components/events'
import { EventsPage } from '@/components/events-page'
import { Status } from '@/components/status'
import { CreateEvent } from '@/components/create-event'
import {
  Calendar,
  ClipboardList,
  Plus,
  FileText,
  MapPin,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Heart,
  Shield,
  Clock
} from 'lucide-react'

type View = 'menu' | 'report' | 'events' | 'events-page' | 'status' | 'create-event'

export default function HomePage() {
  const [view, setView] = useState<View>('menu')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Phoenix",
      text: "This platform made it so easy to report the pothole on my street. It was fixed within 48 hours!",
      rating: 5
    },
    {
      name: "Michael Chen",
      location: "Durban CBD",
      text: "I discovered amazing community events I never knew existed. The location-based recommendations are spot on!",
      rating: 5
    },
    {
      name: "Grace Nkosi",
      location: "Umhlanga",
      text: "Being able to track my issue status in real-time gives me peace of mind. Great service!",
      rating: 5
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <NavBar currentView={view} onNavigate={(v) => setView(v as View)} />

      {/* Main Content */}
      {view === 'report' && <ReportIssue onBack={() => setView('menu')} />}
      {view === 'events' && <Events onBack={() => setView('menu')} />}
      {view === 'events-page' && <EventsPage />}
      {view === 'status' && <Status onBack={() => setView('menu')} />}
      {view === 'create-event' && <CreateEvent onBack={() => setView('menu')} />}

      {view === 'menu' && (
        <div>
          {/* Enhanced Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  Welcome to Smart Municipal Services
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Your Voice.
                  <br />
                  <span className="text-yellow-300">Your Community.</span>
                  <br />
                  <span className="text-3xl lg:text-4xl font-normal text-blue-100">Your Durban.</span>
                </h1>
                <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Connect, report, discover, and engage with your community like never before.
                  From fixing potholes to finding local events, we're making municipal services smarter and more accessible.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setView('report')}
                  >
                    <ClipboardList className="w-5 h-5 mr-2" />
                    Report an Issue
                  </Button>
                  <Button
                    size="lg"
                    className="bg-blue-500 text-white hover:bg-blue-400 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setView('events-page')}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Explore Events
                  </Button>
                </div>
              </div>
            </div>

            {/* Floating Stats */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
                <div className="grid grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">500+</div>
                    <div className="text-sm text-blue-100">Issues Resolved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">50+</div>
                    <div className="text-sm text-blue-100">Community Events</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="text-sm text-blue-100">Support Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Everything You Need in One Place
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Discover how our platform transforms the way you interact with municipal services
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg" onClick={() => setView('report')}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <ClipboardList className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl mb-2">Report Issues</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-gray-600 leading-relaxed">
                      Report municipal issues like potholes, water leaks, or broken streetlights with photos and location tracking
                    </CardDescription>
                    <div className="mt-4 flex items-center justify-center text-red-600 group-hover:text-red-700">
                      <span className="font-medium">Get Started</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg" onClick={() => setView('events-page')}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl mb-2">Local Events</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-gray-600 leading-relaxed">
                      Discover community events with smart search, location-based recommendations, and personalized suggestions
                    </CardDescription>
                    <div className="mt-4 flex items-center justify-center text-blue-600 group-hover:text-blue-700">
                      <span className="font-medium">Explore Now</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg" onClick={() => setView('create-event')}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Plus className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl mb-2">Create Events</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-gray-600 leading-relaxed">
                      Share community events and announcements with your neighbors and build stronger local connections
                    </CardDescription>
                    <div className="mt-4 flex items-center justify-center text-green-600 group-hover:text-green-700">
                      <span className="font-medium">Create Event</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg" onClick={() => setView('status')}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl mb-2">Track Status</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-gray-600 leading-relaxed">
                      Check the status of your reported issues and municipal updates with real-time tracking and notifications
                    </CardDescription>
                    <div className="mt-4 flex items-center justify-center text-purple-600 group-hover:text-purple-700">
                      <span className="font-medium">View Status</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Why Choose Our Platform?
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  We're not just another municipal service platform. We're your community partner.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure & Reliable</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Your data is protected with enterprise-grade security. We ensure all reports are handled confidentially and efficiently.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Fast Response</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our intelligent system prioritizes urgent issues and ensures quick response times. Most issues are addressed within 48 hours.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Community Focused</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Built by the community, for the community. Every feature is designed to strengthen local connections and improve quality of life.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  What Our Community Says
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Real stories from real people making a real difference in Durban
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <Card className="border-0 shadow-xl bg-white">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <blockquote className="text-xl text-gray-700 mb-6 italic">
                        "{testimonials[currentTestimonial].text}"
                      </blockquote>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                          {testimonials[currentTestimonial].name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {testimonials[currentTestimonial].location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center mt-8 gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Make a Difference?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of Durban residents who are already using our platform to improve their community.
                Your voice matters, and together we can create a better Durban for everyone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setView('report')}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Report an Issue Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold"
                  onClick={() => setView('events-page')}
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Discover Events
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="bg-gray-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">eThekwini Connect</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Building stronger communities through technology and collaboration.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Services</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li><button onClick={() => setView('report')} className="hover:text-white transition-colors">Report Issues</button></li>
                    <li><button onClick={() => setView('events-page')} className="hover:text-white transition-colors">Local Events</button></li>
                    <li><button onClick={() => setView('create-event')} className="hover:text-white transition-colors">Create Events</button></li>
                    <li><button onClick={() => setView('status')} className="hover:text-white transition-colors">Track Status</button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Community</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li>About Us</li>
                    <li>Contact</li>
                    <li>Support</li>
                    <li>Privacy Policy</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Connect</h4>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800 pt-8 text-center">
                <p className="text-gray-400">
                  © 2025 eThekwini Municipality. All rights reserved.
                </p>
                <p className="text-gray-400 mt-2">
                  Building a better Durban together, one connection at a time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
