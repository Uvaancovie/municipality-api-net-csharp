'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Shield,
  LogOut,
  Search,
  Filter,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Send,
  Loader2,
  MapPin,
  Calendar,
  Image as ImageIcon,
  X
} from 'lucide-react'

interface Message {
  id: string
  message: string
  isFromAdmin: boolean
  senderName: string
  createdAt: string
}

interface Issue {
  id: string
  title: string
  description: string
  location: string
  category: string
  mediaUrls: string[]
  status: 'Submitted' | 'InProgress' | 'Resolved' | 'Closed'
  createdAt: string
  updatedAt?: string
  messages: Message[]
}

interface Stats {
  total: number
  byStatus: {
    submitted: number
    inProgress: number
    resolved: number
    closed: number
  }
  byCategory: { category: string; count: number }[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'location'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')
  const [updating, setUpdating] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken')
    const name = localStorage.getItem('adminName')
    
    if (!token) {
      router.push('/admin/login')
      return
    }

    setAdminName(name || 'Admin')
    fetchData()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 10000)

    return () => clearInterval(interval)
  }, [sortBy, sortOrder])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      
      if (!token) {
        router.push('/admin/login')
        return
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()

      // Fetch issues
      const issuesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/Admin/issues?sortBy=${sortBy}&sortOrder=${sortOrder}&_t=${timestamp}`,
        { 
          method: 'GET',
          headers,
          cache: 'no-store'
        }
      )
      
      if (issuesResponse.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
        return
      }

      if (issuesResponse.ok) {
        const issuesData = await issuesResponse.json()
        console.log('📊 Fetched issues:', issuesData.length, 'issues')
        console.log('📊 Status breakdown:', {
          submitted: issuesData.filter((i: Issue) => i.status === 'Submitted').length,
          inProgress: issuesData.filter((i: Issue) => i.status === 'InProgress').length,
          resolved: issuesData.filter((i: Issue) => i.status === 'Resolved').length,
          closed: issuesData.filter((i: Issue) => i.status === 'Closed').length
        })
        setIssues(issuesData)
      } else {
        console.error('Failed to fetch issues:', await issuesResponse.text())
      }

      // Fetch stats
      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/Admin/stats?_t=${timestamp}`,
        { 
          method: 'GET',
          headers,
          cache: 'no-store'
        }
      )
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log('📈 Fetched stats:', statsData)
        setStats(statsData)
      } else {
        console.error('Failed to fetch stats:', await statsResponse.text())
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminEmail')
    localStorage.removeItem('adminName')
    localStorage.removeItem('adminExpiresAt')
    router.push('/admin/login')
  }

  const handleUpdateIssue = async () => {
    if (!selectedIssue || !newStatus) return

    setUpdating(true)
    try {
      const token = localStorage.getItem('adminToken')
      
      console.log('🔄 Updating issue:', selectedIssue.id, 'to status:', newStatus)
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/Admin/issues/${selectedIssue.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            message: newMessage || null,
          }),
        }
      )

      if (response.ok) {
        const updatedIssue = await response.json()
        console.log('✅ Issue updated successfully:', updatedIssue)
        
        // Show success message immediately
        alert(`Issue updated successfully! Status changed to ${newStatus}`)
        
        // Clear form
        setNewMessage('')
        setNewStatus('')
        setSelectedIssue(null) // Close modal
        
        // Force immediate refresh with loading state
        console.log('🔄 Refreshing data...')
        setLoading(true)
        await fetchData()
        setLoading(false)
        console.log('✅ Data refreshed')
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to update issue:', errorText)
        alert('Failed to update issue. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error updating issue:', error)
      alert('Failed to update issue. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Submitted':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'InProgress':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'Resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Closed':
        return <XCircle className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'InProgress':
        return 'bg-blue-100 text-blue-800'
      case 'Resolved':
        return 'bg-green-100 text-green-800'
      case 'Closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {adminName}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Issues</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.submitted}</div>
                <div className="text-sm text-gray-600">Submitted</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.byStatus.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.byStatus.resolved}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-600">{stats.byStatus.closed}</div>
                <div className="text-sm text-gray-600">Closed</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search issues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <Label htmlFor="sort">Sort By</Label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'location')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="date">Date</option>
                  <option value="location">Location</option>
                </select>
              </div>
              <div>
                <Label htmlFor="order">Order</Label>
                <select
                  id="order"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={fetchData} variant="outline" size="sm">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Table */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Issues ({filteredIssues.length})</CardTitle>
            <CardDescription>Click on an issue to view details and send feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Messages</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                          {getStatusIcon(issue.status)}
                          <span>{issue.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{issue.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{issue.location}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{issue.category}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{issue.messages.length}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedIssue(issue)
                            setNewStatus(issue.status)
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedIssue.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIssue(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>Issue ID: {selectedIssue.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Issue Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Location</Label>
                  <p className="text-sm text-gray-600">{selectedIssue.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Category</Label>
                  <p className="text-sm text-gray-600">{selectedIssue.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Status</Label>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedIssue.status)}`}>
                    {getStatusIcon(selectedIssue.status)}
                    <span>{selectedIssue.status}</span>
                  </span>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Created</Label>
                  <p className="text-sm text-gray-600">{new Date(selectedIssue.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Description</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedIssue.description}</p>
              </div>

              {/* Images */}
              {selectedIssue.mediaUrls && selectedIssue.mediaUrls.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Attachments</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedIssue.mediaUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => setLightboxImage(url)}
                      >
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Message History</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
                  {selectedIssue.messages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No messages yet</p>
                  ) : (
                    selectedIssue.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.isFromAdmin ? 'bg-blue-100 ml-8' : 'bg-white mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">{msg.senderName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Update Form */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div>
                  <Label htmlFor="newStatus">Update Status</Label>
                  <select
                    id="newStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="newMessage">Send Feedback Message (Optional)</Label>
                  <Textarea
                    id="newMessage"
                    placeholder="Enter a message to the user..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleUpdateIssue}
                  disabled={updating || !newStatus}
                  className="w-full"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Update Issue & Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-6 z-50"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
