'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingProgress } from '@/components/loading-progress'
import { apiClient, eventCategories, eventCategoryMap, type EventItem, type CreateEventDto } from '@/lib/api'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Upload, X, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react'

interface CreateEventProps {
  onBack: () => void
  onSuccess?: () => void
}

interface EventFormData {
  title: string
  description: string
  organizer: string
  startsAt: string
  endsAt: string
  location: string
  category: string
  maxAttendees: string
  requiresRegistration: boolean
  registrationRequired: boolean
  isPublic: boolean
  contactInfo: string
  contactEmail: string
  contactPhone: string
  tags: string
}

export function CreateEvent({ onBack, onSuccess }: CreateEventProps) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    organizer: '',
    startsAt: '',
    endsAt: '',
    location: '',
    category: '',
    maxAttendees: '',
    requiresRegistration: false,
    registrationRequired: false,
    isPublic: true,
    contactInfo: '',
    contactEmail: '',
    contactPhone: '',
    tags: ''
  })

  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventDto) => {
      return await apiClient.createEvent(eventData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setShowSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onBack()
      }, 2000)
    },
    onError: (error) => {
      console.error('Error creating event:', error)
    }
  })

  const uploadMediaMutation = useMutation({
    mutationFn: async (files: File[]) => {
      return await apiClient.uploadEventMedia(files)
    },
    onSuccess: (urls) => {
      setMediaUrls(prev => [...prev, ...urls])
      setMediaFiles([])
    },
    onError: (error) => {
      console.error('Error uploading media:', error)
    }
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Event title is required'
    if (!formData.description.trim()) newErrors.description = 'Event description is required'
    if (!formData.organizer.trim()) newErrors.organizer = 'Event organizer is required'
    if (!formData.startsAt) newErrors.startsAt = 'Start date and time is required'
    if (!formData.location.trim()) newErrors.location = 'Event location is required'
    if (!formData.category) newErrors.category = 'Event category is required'

    // Validate dates
    if (formData.startsAt && formData.endsAt) {
      const startDate = new Date(formData.startsAt)
      const endDate = new Date(formData.endsAt)
      if (endDate <= startDate) {
        newErrors.endsAt = 'End time must be after start time'
      }
    }

    // Validate start date is in the future
    if (formData.startsAt) {
      const startDate = new Date(formData.startsAt)
      if (startDate <= new Date()) {
        newErrors.startsAt = 'Event must be scheduled for a future date'
      }
    }

    // Validate contact info if registration required
    if (formData.registrationRequired) {
      if (!formData.contactEmail.trim() && !formData.contactPhone.trim()) {
        newErrors.contact = 'Contact email or phone is required when registration is enabled'
      }
      if (formData.contactEmail.trim() && !/\S+@\S+\.\S+/.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email address'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      return isValidType && isValidSize
    })
    
    setMediaFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeUploadedMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadMedia = () => {
    if (mediaFiles.length > 0) {
      uploadMediaMutation.mutate(mediaFiles)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    // Combine contact information
    const contactInfo = []
    if (formData.contactEmail.trim()) contactInfo.push(`Email: ${formData.contactEmail.trim()}`)
    if (formData.contactPhone.trim()) contactInfo.push(`Phone: ${formData.contactPhone.trim()}`)
    if (formData.organizer.trim()) contactInfo.push(`Organizer: ${formData.organizer.trim()}`)

    const eventData: CreateEventDto = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      startsAt: formData.startsAt,
      endsAt: formData.endsAt || undefined,
      location: formData.location.trim(),
      category: eventCategoryMap[formData.category] ?? eventCategoryMap['Other'] ?? 8, // Convert category name to enum number
      status: 'Published',
      maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : 0,
      requiresRegistration: formData.registrationRequired,
      contactInfo: contactInfo.length > 0 ? contactInfo.join(' | ') : undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
    }

    console.log('Creating event with data:', eventData); // Debug log
    createEventMutation.mutate(eventData)
  }

  const isLoading = createEventMutation.isPending || uploadMediaMutation.isPending

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Created Successfully!</h2>
              <p className="text-gray-600 mb-4">Your event has been published and is now visible to the community.</p>
              <div className="text-sm text-gray-500">Redirecting you back...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
              <p className="text-sm text-gray-600">Share a community event or announcement</p>
            </div>
          </div>
        </div>
        <LoadingProgress isLoading={isLoading} className="h-1" />
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Event Details</span>
              </CardTitle>
              <CardDescription>
                Basic information about your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter event title"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Event Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your event..."
                    className={errors.description ? 'border-red-500' : ''}
                    rows={4}
                  />
                  {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <Label htmlFor="organizer">Organizer *</Label>
                  <Input
                    id="organizer"
                    value={formData.organizer}
                    onChange={(e) => handleInputChange('organizer', e.target.value)}
                    placeholder="Organization or person name"
                    className={errors.organizer ? 'border-red-500' : ''}
                  />
                  {errors.organizer && <p className="text-sm text-red-600 mt-1">{errors.organizer}</p>}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value: string) => handleInputChange('category', value)}>
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date, Time & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Date, Time & Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startsAt">Start Date & Time *</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => handleInputChange('startsAt', e.target.value)}
                    className={errors.startsAt ? 'border-red-500' : ''}
                  />
                  {errors.startsAt && <p className="text-sm text-red-600 mt-1">{errors.startsAt}</p>}
                </div>

                <div>
                  <Label htmlFor="endsAt">End Date & Time</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => handleInputChange('endsAt', e.target.value)}
                    className={errors.endsAt ? 'border-red-500' : ''}
                  />
                  {errors.endsAt && <p className="text-sm text-red-600 mt-1">{errors.endsAt}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Event venue or address"
                    className={errors.location ? 'border-red-500' : ''}
                  />
                  {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Event Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked: boolean) => handleInputChange('isPublic', checked)}
                    />
                    <Label htmlFor="isPublic">Public Event</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="registrationRequired"
                      checked={formData.registrationRequired}
                      onCheckedChange={(checked: boolean) => handleInputChange('registrationRequired', checked)}
                    />
                    <Label htmlFor="registrationRequired">Registration Required</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    value={formData.maxAttendees}
                    onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>

                {formData.registrationRequired && (
                  <>
                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        placeholder="contact@example.com"
                        className={errors.contactEmail ? 'border-red-500' : ''}
                      />
                      {errors.contactEmail && <p className="text-sm text-red-600 mt-1">{errors.contactEmail}</p>}
                    </div>

                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>
                  </>
                )}

                {errors.contact && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-red-600">{errors.contact}</p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="family-friendly, outdoor, free"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5" />
                <span>Event Media</span>
              </CardTitle>
              <CardDescription>
                Add photos or videos to showcase your event (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="media">Upload Images/Videos</Label>
                <Input
                  id="media"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Max file size: 10MB. Supported formats: JPG, PNG, MP4, etc.
                </p>
              </div>

              {/* Selected Files */}
              {mediaFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Selected Files ({mediaFiles.length})</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUploadMedia}
                      disabled={uploadMediaMutation.isPending}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadMediaMutation.isPending ? 'Uploading...' : 'Upload Files'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative bg-gray-100 rounded-lg p-2">
                        <div className="text-xs truncate">{file.name}</div>
                        <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)}MB</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute -top-1 -right-1 w-6 h-6 p-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Media */}
              {mediaUrls.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Uploaded Media ({mediaUrls.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {mediaUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Event media ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute -top-1 -right-1 w-6 h-6 p-0 bg-white"
                          onClick={() => removeUploadedMedia(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadMediaMutation.error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Upload failed: {uploadMediaMutation.error.message}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-32"
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>

          {/* Error Display */}
          {createEventMutation.error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Failed to create event: {createEventMutation.error.message}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  )
}
