// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5268/api';

// Updated types for simplified API (no authentication)
export interface Message {
  id: string;
  message: string;
  isFromAdmin: boolean;
  senderName: string;
  createdAt: string;
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
  messages: Message[];
}

export interface IssueDto {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  mediaUrls: string[];
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EventDto {
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

export interface CreateIssueDto {
  title: string;
  description: string;
  location: string;
  category: string;
  mediaUrls?: string[];
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  category: number; // EventCategory enum as number
  status: string;
  mediaUrls?: string[];
  contactInfo?: string;
  maxAttendees: number;
  requiresRegistration: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEventDto {
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  category: number;
  status: string;
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

// Map string categories to enum numbers (matches backend EventCategory enum)
export const eventCategoryMap: Record<string, number> = {
  'Community': 0,
  'Government': 1,
  'Public_Safety': 2,
  'Infrastructure': 3,
  'Health': 4,
  'Education': 5,
  'Recreation': 6,
  'Environment': 7,
  'Other': 8
};

// Reverse map for display purposes
export const eventCategoryNames: Record<number, string> = {
  0: 'Community',
  1: 'Government', 
  2: 'Public Safety',
  3: 'Infrastructure',
  4: 'Health',
  5: 'Education',
  6: 'Recreation',
  7: 'Environment',
  8: 'Other'
};

export const issueStatuses = [
  'Submitted',
  'InProgress', 
  'Resolved',
  'Closed'
] as const;

class ApiClient {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getCacheKey(url: string, params?: any): string {
    return `${url}${params ? JSON.stringify(params) : ''}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  // Public method to clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear specific cache entries
  clearCacheByKey(key: string): void {
    this.cache.delete(key);
  }

  private async fetchWithCache<T>(url: string, options?: RequestInit, cacheKey?: string): Promise<T> {
    const key = cacheKey || url;
    
    // Check cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      if (this.isValidCache(cached.timestamp)) {
        return cached.data;
      }
      this.cache.delete(key);
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful responses for GET requests
      if (!options?.method || options.method === 'GET') {
        this.cache.set(key, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      throw error;
    }
  }

  async getIssues(status?: string, category?: string): Promise<Issue[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);

    const queryString = params.toString();
    const url = `${this.baseUrl}/Issues${queryString ? `?${queryString}` : ''}`;
    const cacheKey = this.getCacheKey('issues', { status, category });

    return this.fetchWithCache<Issue[]>(url, undefined, cacheKey);
  }

  async getIssueById(id: string): Promise<Issue> {
    const url = `${this.baseUrl}/Issues/${id}`;
    const cacheKey = this.getCacheKey('issue', { id });

    return this.fetchWithCache<Issue>(url, undefined, cacheKey);
  }

  async createIssue(issue: CreateIssueDto): Promise<Issue> {
    // Clear issues cache when creating new issue
    this.cache.clear();
    
    return this.fetchWithCache<Issue>(`${this.baseUrl}/Issues`, {
      method: 'POST',
      body: JSON.stringify(issue),
    });
  }

  async updateIssueStatus(id: string, statusUpdate: UpdateStatusDto): Promise<Issue> {
    // Clear cache for this issue and issues list
    this.cache.delete(this.getCacheKey('issue', { id }));
    this.cache.clear(); // Clear all issues cache when status changes

    return this.fetchWithCache<Issue>(`${this.baseUrl}/Issues/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusUpdate),
    });
  }

  async uploadFiles(files: FileList): Promise<string[]> {
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('Files', file)
    })

    // File uploads shouldn't be cached and need longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for uploads

    try {
      const response = await fetch(`${this.baseUrl}/Issues/upload-media`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timeout - please try with smaller files');
      }
      throw error;
    }
  }

  async getEvents(): Promise<EventDto[]> {
    const cacheKey = this.getCacheKey('events', {});
    return this.fetchWithCache<EventDto[]>(`${this.baseUrl}/Events`, undefined, cacheKey);
  }

  async createEvent(event: CreateEventDto): Promise<EventItem> {
    const response = await fetch(`${this.baseUrl}/Events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    // Clear events cache when creating new event
    this.clearCacheByKey(this.getCacheKey('events', {}));
    
    return response.json();
  }

  async uploadEventMedia(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${this.baseUrl}/Events/upload-media`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Upload failed');
        throw new Error(`Media upload failed: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timeout - please try with smaller files');
      }
      throw error;
    }
  }

  // ==================== PART 2: Event Service Methods ====================

  /**
   * Get all events from EventService (uses SortedDictionary)
   */
  async getEventsFromService(): Promise<EventDto[]> {
    return this.fetchWithCache<EventDto[]>(
      `${this.baseUrl}/Events/service/all`,
      {},
      'events-service'
    );
  }

  /**
   * Search events with filters
   */
  async searchEvents(params: {
    query?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<EventDto[]> {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.category) queryParams.append('category', params.category);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    return this.fetchWithCache<EventDto[]>(
      `${this.baseUrl}/Events/search?${queryParams.toString()}`,
      {},
      `search-${queryParams.toString()}`
    );
  }

  /**
   * Get personalized recommendations based on search history
   */
  async getEventRecommendations(count: number = 5): Promise<{
    message: string;
    count: number;
    events: EventDto[];
  }> {
    return this.fetchWithCache(
      `${this.baseUrl}/Events/recommendations?count=${count}`,
      {},
      `recommendations-${count}`
    );
  }

  async getEventRecommendationsByArea(count: number = 5, area?: string): Promise<{
    message: string;
    count: number;
    events: EventDto[];
  }> {
    const qs = new URLSearchParams();
    qs.append('count', String(count));
    if (area) qs.append('area', area);
    return this.fetchWithCache(
      `${this.baseUrl}/Events/recommendations?${qs.toString()}`,
      {},
      `recommendations-${count}-${area ?? 'all'}`
    );
  }

  /**
   * Get location-based recommendations combining area and category preferences
   */
  async getEventRecommendationsByLocation(count: number = 5, location?: string, category?: string): Promise<{
    message: string;
    count: number;
    location: string;
    category: string;
    events: EventDto[];
  }> {
    const qs = new URLSearchParams();
    qs.append('count', String(count));
    if (location) qs.append('location', location);
    if (category && category !== 'all') qs.append('category', category);
    return this.fetchWithCache(
      `${this.baseUrl}/Events/recommendations/location?${qs.toString()}`,
      {},
      `recommendations-location-${count}-${location ?? 'all'}-${category ?? 'all'}`
    );
  }

  /**
   * Track search query for recommendation engine
   */
  async trackSearch(query: string): Promise<void> {
    await fetch(`${this.baseUrl}/Events/track-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  }

  /**
   * Get recently viewed events (Stack - LIFO)
   */
  async getRecentlyViewedEvents(count: number = 5): Promise<EventDto[]> {
    return this.fetchWithCache<EventDto[]>(
      `${this.baseUrl}/Events/recently-viewed?count=${count}`,
      {},
      `recently-viewed-${count}`
    );
  }

  /**
   * Get upcoming events (Queue - FIFO)
   */
  async getUpcomingEvents(count: number = 10): Promise<EventDto[]> {
    return this.fetchWithCache<EventDto[]>(
      `${this.baseUrl}/Events/upcoming?count=${count}`,
      {},
      `upcoming-${count}`
    );
  }

  /**
   * Get all unique categories (HashSet)
   */
  async getEventCategories(): Promise<string[]> {
    return this.fetchWithCache<string[]>(
      `${this.baseUrl}/Events/categories`,
      {},
      'categories'
    );
  }

  /**
   * Get event by ID and track as viewed (adds to Stack)
   */
  async getEventFromService(id: string): Promise<EventDto> {
    const response = await fetch(`${this.baseUrl}/Events/service/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to get event: ${response.statusText}`);
    }
    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export const api = apiClient; // Export as 'api' for convenience
