'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingProgress, CardSkeleton } from '@/components/loading-progress'
import { apiClient, type Issue, issueStatuses, issueCategories } from '@/lib/api'
import { ArrowLeft, Search, Filter, RefreshCw, AlertCircle, ExternalLink, X, Eye, ZoomIn } from 'lucide-react'

interface StatusProps {
  onBack: () => void
}

export function Status({ onBack }: StatusProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchId, setSearchId] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Use React Query for data fetching with automatic caching
  const {
    data: issues = [],
    isLoading: loading,
    error,
    refetch: loadIssues
  } = useQuery({
    queryKey: ['issues', selectedStatus, selectedCategory],
    queryFn: () => apiClient.getIssues(selectedStatus || undefined, selectedCategory || undefined),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })

  const clearFilters = () => {
    setSelectedStatus('')
    setSelectedCategory('')
    setSearchId('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'InProgress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isImageUrl = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    const urlLower = url.toLowerCase()
    return imageExtensions.some(ext => urlLower.includes(ext))
  }

  const getFileNameFromUrl = (url: string) => {
    try {
      const urlParts = url.split('/')
      return urlParts[urlParts.length - 1] || `Attachment`
    } catch {
      return 'Attachment'
    }
  }

  // Filter issues based on search
  let filteredIssues = issues
  if (searchId.trim()) {
    filteredIssues = issues.filter(issue => 
      issue.id.toLowerCase().includes(searchId.toLowerCase()) ||
      issue.title.toLowerCase().includes(searchId.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchId.toLowerCase())
    )
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Service Request Status</h1>
                <p className="text-sm text-gray-600">Track your service requests and issues</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => loadIssues()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <LoadingProgress isLoading={loading} className="h-1" />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filter & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search by ID */}
              <div>
                <Label htmlFor="search">Search by ID or keyword</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Enter issue ID or keyword..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Status</option>
                  {issueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  {issueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Clear Button */}
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error: {error?.message || 'Failed to load issues'}</span>
              </div>
              <Button onClick={() => loadIssues()} className="mt-3" variant="outline" size="sm">
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Issues List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchId.trim() ? 
                      'No issues match your search criteria. Try adjusting your filters.' :
                      'No service requests found. Submit your first issue to get started.'
                    }
                  </p>
                  {(selectedStatus || selectedCategory || searchId.trim()) && (
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {filteredIssues.map((issue) => (
                  <Card key={issue.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{issue.title}</CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">ID:</span>
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{issue.id}</code>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">Category:</span>
                              <span>{issue.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(issue.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-gray-700 mb-4">{issue.description}</p>

                      {issue.mediaUrls && issue.mediaUrls.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {issue.mediaUrls.map((url, index) => {
                              const isImage = isImageUrl(url)
                              const fileName = getFileNameFromUrl(url)
                              
                              if (isImage) {
                                return (
                                  <div key={index} className="relative group">
                                    <div 
                                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                      onClick={() => setSelectedImage(url)}
                                    >
                                      <img
                                        src={url}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                          target.nextElementSibling?.classList.remove('hidden')
                                        }}
                                      />
                                      <div className="hidden w-full h-full flex items-center justify-center bg-gray-200">
                                        <ExternalLink className="w-8 h-8 text-gray-400" />
                                      </div>
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-all duration-200">
                                      <div className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 rounded-full p-2 transition-opacity duration-200">
                                        <ZoomIn className="w-4 h-4 text-gray-700" />
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate" title={fileName}>
                                      {fileName}
                                    </p>
                                  </div>
                                )
                              } else {
                                return (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                  >
                                    <ExternalLink className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-xs text-center text-gray-600 truncate w-full" title={fileName}>
                                      {fileName}
                                    </span>
                                  </a>
                                )
                              }
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                        <div className="flex items-center space-x-1">
                          <span>📍</span>
                          <span>{issue.location}</span>
                        </div>
                        {issue.updatedAt && (
                          <span>Updated: {formatDate(issue.updatedAt)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Summary Stats */}
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                    <CardDescription>Overview of all service requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {issues.length}
                        </div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {issues.filter(i => i.status === 'Submitted').length}
                        </div>
                        <div className="text-sm text-gray-600">Submitted</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {issues.filter(i => i.status === 'InProgress').length}
                        </div>
                        <div className="text-sm text-gray-600">In Progress</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {issues.filter(i => i.status === 'Resolved').length}
                        </div>
                        <div className="text-sm text-gray-600">Resolved</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Full size attachment"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
