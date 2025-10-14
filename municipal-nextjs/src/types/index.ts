// Shared type definitions for the Municipal Services application

export interface EventItem {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  category: string;
  status: string;
  mediaUrls: string[];
  contactInfo?: string;
  maxAttendees: number;
  requiresRegistration: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  mediaUrls: string[];
  status: 'Submitted' | 'InProgress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateIssueDto {
  title: string;
  description: string;
  location: string;
  category: string;
  mediaUrls?: string[];
}

export interface CreateEventDto {
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  category: string;
  status?: string;
  mediaUrls?: string[];
  contactInfo?: string;
  maxAttendees: number;
  requiresRegistration: boolean;
}

export interface UpdateStatusDto {
  status: 'Submitted' | 'InProgress' | 'Resolved' | 'Closed';
}

export const issueCategories = [
  'Sanitation',
  'Roads',
  'Utilities',
  'Water',
  'Electricity',
  'Housing',
  'Other'
] as const;

export const eventCategories = [
  'Community',
  'Government',
  'Public_Safety',
  'Infrastructure',
  'Health',
  'Education',
  'Recreation',
  'Environment',
  'Other'
] as const;

export type IssueCategory = typeof issueCategories[number];
export type EventCategory = typeof eventCategories[number];
export type IssueStatus = 'Submitted' | 'InProgress' | 'Resolved' | 'Closed';
