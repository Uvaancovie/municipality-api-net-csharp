'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Search, Users, Clock, Filter, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import type { EventItem } from '@/types';

type SortOption = 'date-asc' | 'date-desc' | 'title-asc' | 'title-desc' | 'category';

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [recommendations, setRecommendations] = useState<EventItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');
  const [loading, setLoading] = useState(true);
  
  // Location-based recommendation state
  const [userLocation, setUserLocation] = useState('');
  const [locationRecommendations, setLocationRecommendations] = useState<EventItem[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    loadEvents();
    loadCategories();
    loadRecommendations();
    loadRecentlyViewed();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEventsFromService();
      setEvents(data);
      setFilteredEvents(data);
      
      // Extract unique locations from events
      const uniqueLocations = Array.from(new Set(data.map(event => event.location))).sort();
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await api.getEventCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const result = await api.getEventRecommendations(5);
      setRecommendations(result.events || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadRecentlyViewed = async () => {
    try {
      const data = await api.getRecentlyViewedEvents(5);
      setRecentlyViewed(data);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  };

  const loadLocationRecommendations = async (location: string, category?: string) => {
    if (!location.trim()) return;
    
    try {
      setLocationLoading(true);
      const result = await api.getEventRecommendationsByLocation(5, location, category);
      setLocationRecommendations(result.events || []);
    } catch (error) {
      console.error('Error loading location recommendations:', error);
      setLocationRecommendations([]);
    } finally {
      setLocationLoading(false);
    }
  };

  // Real-time search and filter using useMemo for performance
  const filteredAndSortedEvents = useMemo(() => {
    let results = [...events];

    // Filter by category (uses HashSet on backend)
    if (selectedCategory !== 'all') {
      results = results.filter(e => {
        const eventCategory = typeof e.category === 'string' ? e.category : String(e.category);
        // Match both exact and formatted category names (e.g., "Community" or "Public_Safety" matches "Public Safety")
        return eventCategory === selectedCategory || 
               eventCategory.replace('_', ' ') === selectedCategory ||
               selectedCategory.replace('_', ' ') === eventCategory;
      });
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      results = results.filter(e => e.location === selectedLocation);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(e => {
        const category = typeof e.category === 'string' ? e.category : String(e.category);
        return e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query);
      });
    }

    // Sort (uses SortedDictionary on backend for date ordering)
    results.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
        case 'date-desc':
          return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'category':
          const catA = typeof a.category === 'string' ? a.category : String(a.category);
          const catB = typeof b.category === 'string' ? b.category : String(b.category);
          return catA.localeCompare(catB);
        default:
          return 0;
      }
    });

    return results;
  }, [events, searchQuery, selectedCategory, selectedLocation, sortBy]);

  // Track search on backend for recommendations
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        await api.trackSearch(query);
        // Reload recommendations after tracking
        loadRecommendations();
      } catch (error) {
        console.error('Error tracking search:', error);
      }
    }
  };

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    if (category !== 'all') {
      try {
        await api.trackSearch(category);
        loadRecommendations();
      } catch (error) {
        console.error('Error tracking category:', error);
      }
    }
    // Reload location recommendations with new category filter
    if (userLocation.trim()) {
      loadLocationRecommendations(userLocation, category !== 'all' ? category : undefined);
    }
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
  };

  const handleEventClick = async (eventId: string) => {
    try {
      // This will add the event to the recently viewed stack
      await api.getEventFromService(eventId);
      loadRecentlyViewed();
    } catch (error) {
      console.error('Error tracking event view:', error);
    }
  };

  // Get user's current location using geolocation API
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use reverse geocoding to get location name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          const locationName = data.city || data.locality || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setUserLocation(locationName);
          loadLocationRecommendations(locationName, selectedCategory !== 'all' ? selectedCategory : undefined);
        } catch (error) {
          console.error('Error getting location name:', error);
          const locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setUserLocation(locationName);
          loadLocationRecommendations(locationName, selectedCategory !== 'all' ? selectedCategory : undefined);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enter it manually.');
      }
    );
  };

  // Handle location input change and get recommendations
  const handleUserLocationChange = async (location: string) => {
    setUserLocation(location);
    if (location.trim()) {
      loadLocationRecommendations(location, selectedCategory !== 'all' ? selectedCategory : undefined);
    } else {
      setLocationRecommendations([]);
    }
  };

  // When a user clicks a location, request area-specific recommendations and filter
  const handleLocationClick = async (location: string) => {
    try {
      // Use the API to fetch recommendations scoped to the clicked location
      const rec = await api.getEventRecommendationsByArea(5, location);
      setRecommendations(rec.events || []);

      // Optionally set the category filter to 'all' and search by the location text
      setSelectedCategory('all');
      setSearchQuery(location);
      // Track the location as a search term for analytics
      await api.trackSearch(location);
    } catch (error) {
      console.error('Error loading area-specific recommendations:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Local Events & Announcements</h1>
        <p className="text-gray-600">Discover upcoming events and activities in your community</p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-asc">Date (Earliest First)</SelectItem>
                <SelectItem value="date-desc">Date (Latest First)</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location-Based Recommendations */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Location-Based Recommendations</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your location (e.g., Durban, Phoenix, Johannesburg)"
                value={userLocation}
                onChange={(e) => handleUserLocationChange(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={getCurrentLocation}
                variant="outline"
                className="whitespace-nowrap"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Use My Location
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Get personalized event recommendations based on your location and preferences
            </p>
          </div>

          {/* Active Filters Display */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {searchQuery && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                Search: "{searchQuery}"
                <button onClick={() => handleSearch('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                Category: {selectedCategory}
                <button onClick={() => handleCategoryChange('all')} className="hover:text-green-900">×</button>
              </span>
            )}
            {selectedLocation !== 'all' && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1">
                Location: {selectedLocation}
                <button onClick={() => handleLocationChange('all')} className="hover:text-orange-900">×</button>
              </span>
            )}
            {userLocation && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                Location: {userLocation}
                <button onClick={() => handleUserLocationChange('')} className="hover:text-purple-900">×</button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing <span className="font-semibold">{filteredAndSortedEvents.length}</span> of{' '}
        <span className="font-semibold">{events.length}</span> events
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredAndSortedEvents.map((event) => (
          <Card 
            key={event.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleEventClick(event.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {typeof event.category === 'string' ? event.category.replace('_', ' ') : event.category}
                </span>
                {event.requiresRegistration && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                    Registration Required
                  </span>
                )}
              </div>
              <CardTitle className="text-xl">{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.startsAt)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <button
                    onClick={() => handleLocationClick(event.location)}
                    className="text-blue-600 underline text-left hover:text-blue-800"
                    title={`View events near ${event.location}`}
                  >
                    {event.location}
                  </button>
                </div>
                
                {event.maxAttendees > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Max {event.maxAttendees} attendees</span>
                  </div>
                )}

                {event.endsAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Ends: {formatDate(event.endsAt)}</span>
                  </div>
                )}
              </div>

              {event.contactInfo && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">Contact: {event.contactInfo}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No events found matching your criteria</p>
          <Button 
            onClick={() => { 
              setSearchQuery(''); 
              setSelectedCategory('all');
              setSelectedLocation('all');
            }} 
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Location-Based Recommendations */}
      {locationRecommendations.length > 0 && (
        <div className="mt-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <CardTitle>Recommended for {userLocation}</CardTitle>
              </div>
              <p className="text-sm text-gray-600">
                Events near {userLocation} {selectedCategory !== 'all' ? `in ${selectedCategory} category` : ''}
                {locationLoading && <span className="ml-2 text-blue-600">Loading...</span>}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locationRecommendations.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-purple-600">
                        {typeof event.category === 'string' ? event.category.replace('_', ' ') : event.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.startsAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{event.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mt-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle>You May Also Like</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Based on your search history</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-blue-600">
                        {typeof event.category === 'string' ? event.category.replace('_', ' ') : event.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.startsAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{event.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recently Viewed</CardTitle>
              <p className="text-sm text-gray-600">Events you've checked out</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentlyViewed.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <div className="flex-1">
                      <h5 className="font-medium">{event.title}</h5>
                      <p className="text-xs text-gray-500">
                        {typeof event.category === 'string' ? event.category.replace('_', ' ') : event.category} • {event.location}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(event.startsAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
