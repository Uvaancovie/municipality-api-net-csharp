'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient, issueCategories } from '@/lib/api'
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const reportSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  category: z.enum(issueCategories),
})

type ReportFormData = z.infer<typeof reportSchema>

interface ReportIssueProps {
  onBack: () => void
}

export function ReportIssue({ onBack }: ReportIssueProps) {
  const [files, setFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issueId, setIssueId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  })

  const onSubmit = async (data: ReportFormData) => {
    setSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      let mediaUrls: string[] = []

      // Upload files if any
      if (files && files.length > 0) {
        setUploadProgress(25)
        try {
          mediaUrls = await apiClient.uploadFiles(files)
          setUploadProgress(75)
        } catch (uploadError: any) {
          // Log the upload error but continue without files
          console.warn('File upload failed, proceeding without files:', uploadError.message)
          setUploadProgress(50)
        }
      }

      // Create issue
      const issue = await apiClient.createIssue({
        ...data,
        mediaUrls,
      })

      setUploadProgress(100)
      setIssueId(issue.id)
      setSuccess(true)
      reset()
      setFiles(null)
    } catch (err: any) {
      setError(err.message || 'Failed to submit issue')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Success!</CardTitle>
            <CardDescription>
              Your issue has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {issueId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Your reference number:</p>
                <p className="font-mono text-lg font-semibold text-gray-900">{issueId}</p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              You will receive updates on the progress of your request. Keep your reference number for tracking.
            </p>
            <div className="flex space-x-3">
              <Button onClick={onBack} variant="outline" className="flex-1">
                Submit Another
              </Button>
              <Button onClick={() => setSuccess(false)} className="flex-1">
                View Status
              </Button>
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
              <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
              <p className="text-sm text-gray-600">Help us improve your community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us address your concern quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('category')}
                >
                  <option value="">Select a category</option>
                  {issueCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Corner of Smith & Main St, Durban Central"
                  {...register('location')}
                />
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please describe the issue in detail..."
                  className="min-h-[120px]"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="files">Photos/Documents</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    id="files"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="files" className="cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Click to upload images or documents
                    </span>
                    <br />
                    <span className="text-xs text-gray-400">
                      PNG, JPG, PDF up to 10MB each
                    </span>
                  </label>
                  {files && files.length > 0 && (
                    <div className="mt-3 text-sm text-green-600">
                      {files.length} file(s) selected
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Progress Bar */}
              {submitting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Submitting your report...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Issue'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
