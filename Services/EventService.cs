using MunicipalApi.Models;
using System.Collections.Concurrent;

namespace MunicipalApi.Services;

/// <summary>
/// Service managing local events with advanced data structures for efficient searching,
/// sorting, tracking, and recommendations.
/// </summary>
public class EventService
{
    // Primary storage: SortedDictionary for chronological ordering (O(log n) operations)
    private readonly SortedDictionary<DateTime, List<EventItem>> _eventsByDate;
    
    // Stack: Track recently viewed events (LIFO - Last In First Out)
    private readonly Stack<EventItem> _recentlyViewedEvents;
    
    // Queue: Manage upcoming events in order (FIFO - First In First Out)
    private readonly Queue<EventItem> _upcomingEventsQueue;
    
    // HashSet: Maintain unique categories for O(1) filtering
    private readonly HashSet<EventCategory> _uniqueCategories;
    
    // Dictionary: Track user search frequencies for recommendations
    private readonly Dictionary<string, int> _searchFrequency;
    
    // All events by ID for quick lookups
    private readonly Dictionary<Guid, EventItem> _eventsById;
    
    // Thread-safe collection for concurrent access
    private readonly object _lock = new();

    public EventService()
    {
        _eventsByDate = new SortedDictionary<DateTime, List<EventItem>>();
        _recentlyViewedEvents = new Stack<EventItem>(20); // Keep last 20 viewed
        _upcomingEventsQueue = new Queue<EventItem>();
        _uniqueCategories = new HashSet<EventCategory>();
        _searchFrequency = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        _eventsById = new Dictionary<Guid, EventItem>();
        
        // Initialize with seed data
        SeedEvents();
    }

    /// <summary>
    /// Get all events sorted chronologically
    /// </summary>
    public List<EventItem> GetAllEvents()
    {
        lock (_lock)
        {
            return _eventsByDate
                .SelectMany(kvp => kvp.Value)
                .OrderBy(e => e.StartsAt)
                .ToList();
        }
    }

    /// <summary>
    /// Get event by ID and add to recently viewed stack
    /// </summary>
    public EventItem? GetEventById(Guid id)
    {
        lock (_lock)
        {
            if (_eventsById.TryGetValue(id, out var eventItem))
            {
                // Add to recently viewed stack
                _recentlyViewedEvents.Push(eventItem);
                return eventItem;
            }
            return null;
        }
    }

    /// <summary>
    /// Search events by category, date, or keyword
    /// Uses HashSet for O(1) category lookups
    /// </summary>
    public List<EventItem> SearchEvents(string? query = null, string? category = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        lock (_lock)
        {
            var results = GetAllEvents();

            // Filter by category using HashSet
            if (!string.IsNullOrWhiteSpace(category))
            {
                // Try to parse category string to enum
                if (Enum.TryParse<EventCategory>(category, true, out var categoryEnum) && 
                    _uniqueCategories.Contains(categoryEnum))
                {
                    results = results.Where(e => e.Category == categoryEnum).ToList();
                    TrackSearch(category);
                }
            }

            // Filter by date range using SortedDictionary
            if (startDate.HasValue)
            {
                results = results.Where(e => e.StartsAt >= startDate.Value).ToList();
            }
            if (endDate.HasValue)
            {
                results = results.Where(e => e.StartsAt <= endDate.Value).ToList();
            }

            // Text search in title and description
            if (!string.IsNullOrWhiteSpace(query))
            {
                results = results.Where(e => 
                    e.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                    e.Description.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                    e.Location.Contains(query, StringComparison.OrdinalIgnoreCase)
                ).ToList();
                TrackSearch(query);
            }

            return results;
        }
    }

    /// <summary>
    /// Get recommended events based on user's search history
    /// Analyzes search frequency dictionary to find patterns
    /// </summary>
    public List<EventItem> GetRecommendations(int count = 5, string? area = null)
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;

            // If no search history and no area provided, fall back to upcoming queue
            if (_searchFrequency.Count == 0 && string.IsNullOrWhiteSpace(area))
            {
                return _upcomingEventsQueue.Take(count).ToList();
            }

            // Collect future events as candidate pool
            var futureEvents = GetAllEvents().Where(e => e.StartsAt >= now).ToList();

            var result = new List<EventItem>();

            // 1) If area specified, prioritize events that match the area (location/title match)
            if (!string.IsNullOrWhiteSpace(area))
            {
                var a = area.Trim();
                var areaMatches = futureEvents
                    .Where(e => e.Location.Contains(a, StringComparison.OrdinalIgnoreCase) ||
                                e.Title.Contains(a, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(e => e.StartsAt)
                    .ToList();

                if (areaMatches.Count > 0)
                {
                    result.AddRange(areaMatches);
                    // If we already have enough, return
                    return result.Take(count).ToList();
                }
                // otherwise continue but keep area in mind for prioritization
            }

            // 2) Recommend based on most-searched terms (categories/keywords)
            if (_searchFrequency.Count > 0)
            {
                var topCategories = _searchFrequency
                    .OrderByDescending(kvp => kvp.Value)
                    .Take(3)
                    .Select(kvp => kvp.Key)
                    .ToList();

                var analyticsMatches = futureEvents
                    .Where(e => topCategories.Any(cat =>
                        e.Category.ToString().Contains(cat, StringComparison.OrdinalIgnoreCase) ||
                        e.Title.Contains(cat, StringComparison.OrdinalIgnoreCase) ||
                        e.Description.Contains(cat, StringComparison.OrdinalIgnoreCase)
                    ))
                    .OrderBy(e => e.StartsAt)
                    .ToList();

                foreach (var ev in analyticsMatches)
                {
                    if (!result.Contains(ev)) result.Add(ev);
                }
            }

            // 3) Fill remaining slots from future events, prioritizing area matches if provided
            foreach (var ev in futureEvents.OrderBy(e => e.StartsAt))
            {
                if (result.Count >= count) break;
                if (!result.Contains(ev))
                {
                    // If area provided, prefer those with location match (they'll be inserted earlier in result if match found earlier)
                    result.Add(ev);
                }
            }

            // 4) If still empty (very unlikely), fall back to upcoming queue
            if (result.Count == 0)
            {
                result.AddRange(_upcomingEventsQueue.Where(e => e.StartsAt >= now).Take(count));
            }

            return result.Take(count).ToList();
        }
    }

    /// <summary>
    /// Get recently viewed events from stack (LIFO)
    /// </summary>
    public List<EventItem> GetRecentlyViewed(int count = 5)
    {
        lock (_lock)
        {
            return _recentlyViewedEvents
                .Take(count)
                .Distinct()
                .ToList();
        }
    }

    /// <summary>
    /// Get upcoming events from queue (FIFO)
    /// </summary>
    public List<EventItem> GetUpcomingEvents(int count = 10)
    {
        lock (_lock)
        {
            return _upcomingEventsQueue
                .Take(count)
                .ToList();
        }
    }

    /// <summary>
    /// Get all unique categories as strings
    /// </summary>
    public List<string> GetCategories()
    {
        lock (_lock)
        {
            return _uniqueCategories.OrderBy(c => c).Select(c => c.ToString()).ToList();
        }
    }

    /// <summary>
    /// Track search queries for recommendation engine
    /// </summary>
    public void TrackSearch(string query)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(query)) return;

            query = query.Trim();
            if (_searchFrequency.ContainsKey(query))
            {
                _searchFrequency[query]++;
            }
            else
            {
                _searchFrequency[query] = 1;
            }
        }
    }

    /// <summary>
    /// Add new event to all data structures
    /// </summary>
    public EventItem AddEvent(EventItem eventItem)
    {
        lock (_lock)
        {
            // Add to dictionary by ID
            _eventsById[eventItem.Id] = eventItem;

            // Add to sorted dictionary by date
            var dateKey = eventItem.StartsAt.Date;
            if (!_eventsByDate.ContainsKey(dateKey))
            {
                _eventsByDate[dateKey] = new List<EventItem>();
            }
            _eventsByDate[dateKey].Add(eventItem);

            // Add category to unique set
            _uniqueCategories.Add(eventItem.Category);

            // Add to upcoming queue if future event
            if (eventItem.StartsAt >= DateTime.UtcNow)
            {
                _upcomingEventsQueue.Enqueue(eventItem);
            }

            return eventItem;
        }
    }

    /// <summary>
    /// Update existing event
    /// </summary>
    public EventItem? UpdateEvent(Guid id, EventItem updatedEvent)
    {
        lock (_lock)
        {
            if (!_eventsById.ContainsKey(id))
            {
                return null;
            }

            // Remove old event
            var oldEvent = _eventsById[id];
            var oldDateKey = oldEvent.StartsAt.Date;
            if (_eventsByDate.ContainsKey(oldDateKey))
            {
                _eventsByDate[oldDateKey].Remove(oldEvent);
            }

            // Update with new data
            updatedEvent.Id = id;
            _eventsById[id] = updatedEvent;

            // Re-add to sorted dictionary
            var newDateKey = updatedEvent.StartsAt.Date;
            if (!_eventsByDate.ContainsKey(newDateKey))
            {
                _eventsByDate[newDateKey] = new List<EventItem>();
            }
            _eventsByDate[newDateKey].Add(updatedEvent);

            // Update category set
            _uniqueCategories.Add(updatedEvent.Category);

            return updatedEvent;
        }
    }

    /// <summary>
    /// Get location-based recommendations combining area and category preferences
    /// </summary>
    public List<EventItem> GetLocationBasedRecommendations(int count, string location, string category = "")
    {
        lock (_lock)
        {
            var allEvents = GetAllEvents();
            
            // Filter by location (simple string matching - could be enhanced with geocoding)
            var locationFiltered = allEvents.Where(e => 
                e.Location.Contains(location, StringComparison.OrdinalIgnoreCase) ||
                location.Contains(e.Location.Split(',')[0], StringComparison.OrdinalIgnoreCase)
            ).ToList();
            
            // Filter by category if specified
            if (!string.IsNullOrEmpty(category) && category != "all")
            {
                locationFiltered = locationFiltered.Where(e => 
                    e.Category.ToString().Equals(category, StringComparison.OrdinalIgnoreCase) ||
                    e.Category.ToString().Replace("_", " ").Equals(category, StringComparison.OrdinalIgnoreCase)
                ).ToList();
            }
            
            // Sort by relevance (upcoming events first, then by search frequency)
            var sorted = locationFiltered
                .Where(e => e.StartsAt > DateTime.UtcNow) // Only future events
                .OrderBy(e => e.StartsAt) // Soonest first
                .ThenByDescending(e => _searchFrequency.GetValueOrDefault(e.Title.ToLower(), 0)) // Most searched
                .Take(count)
                .ToList();
                
            return sorted;
        }
    }

    /// <summary>
    /// Seed initial events with diverse categories and dates
    /// </summary>
    private void SeedEvents()
    {
        var baseDate = DateTime.UtcNow.Date;
        var events = new List<EventItem>
        {
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Community Clean-Up Drive",
                Description = "Join us for a city-wide cleanup initiative. Bring your family and help make Durban cleaner. Refreshments provided.",
                Category = EventCategory.Community,
                Location = "Durban Beachfront",
                StartsAt = baseDate.AddDays(7).AddHours(8),
                EndsAt = baseDate.AddDays(7).AddHours(12),
                Status = EventStatus.Published,
                RequiresRegistration = true,
                MaxAttendees = 200,
                ContactInfo = "cleanup@durban.gov.za",
                MediaUrls = new List<string> { "/images/cleanup.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Water Conservation Workshop",
                Description = "Learn practical tips to reduce water usage at home. Expert speakers and hands-on demonstrations.",
                Category = EventCategory.Education,
                Location = "City Hall Auditorium",
                StartsAt = baseDate.AddDays(10).AddHours(14),
                EndsAt = baseDate.AddDays(10).AddHours(16),
                Status = EventStatus.Published,
                RequiresRegistration = true,
                MaxAttendees = 150,
                ContactInfo = "water@durban.gov.za",
                MediaUrls = new List<string> { "/images/water-workshop.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Road Safety Awareness Campaign",
                Description = "Free road safety training for drivers and pedestrians. Learn about traffic rules and safe driving practices.",
                Category = EventCategory.Other,
                Location = "Moses Mabhida Stadium Parking",
                StartsAt = baseDate.AddDays(5).AddHours(9),
                EndsAt = baseDate.AddDays(5).AddHours(15),
                Status = EventStatus.Published,
                RequiresRegistration = false,
                MaxAttendees = 0,
                ContactInfo = "traffic@durban.gov.za",
                MediaUrls = new List<string> { "/images/road-safety.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Municipal Budget Public Hearing",
                Description = "Attend the public hearing for the 2025/26 municipal budget. Your voice matters in city planning.",
                Category = EventCategory.Government,
                Location = "Durban City Hall",
                StartsAt = baseDate.AddDays(14).AddHours(10),
                EndsAt = baseDate.AddDays(14).AddHours(13),
                Status = EventStatus.Published,
                RequiresRegistration = false,
                MaxAttendees = 0,
                ContactInfo = "budget@durban.gov.za",
                MediaUrls = new List<string> { "/images/budget-hearing.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Youth Sports Tournament",
                Description = "Annual youth sports competition featuring soccer, netball, and athletics. Open to ages 12-18.",
                Category = EventCategory.Recreation,
                Location = "Kings Park Stadium",
                StartsAt = baseDate.AddDays(21).AddHours(8),
                EndsAt = baseDate.AddDays(21).AddHours(17),
                Status = EventStatus.Published,
                RequiresRegistration = true,
                MaxAttendees = 500,
                ContactInfo = "sports@durban.gov.za",
                MediaUrls = new List<string> { "/images/sports-tournament.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Heritage Day Celebration",
                Description = "Celebrate South African heritage with traditional music, dance, and food. Free entry for all.",
                Category = EventCategory.Community,
                Location = "Blue Lagoon Park",
                StartsAt = baseDate.AddDays(45).AddHours(10),
                EndsAt = baseDate.AddDays(45).AddHours(18),
                Status = EventStatus.Published,
                RequiresRegistration = false,
                MaxAttendees = 0,
                ContactInfo = "culture@durban.gov.za",
                MediaUrls = new List<string> { "/images/heritage-day.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Free Health Screening",
                Description = "Free blood pressure, diabetes, and HIV testing. Nurses and doctors available for consultation.",
                Category = EventCategory.Health,
                Location = "Umlazi Community Centre",
                StartsAt = baseDate.AddDays(3).AddHours(8),
                EndsAt = baseDate.AddDays(3).AddHours(14),
                Status = EventStatus.Published,
                RequiresRegistration = false,
                MaxAttendees = 0,
                ContactInfo = "health@durban.gov.za",
                MediaUrls = new List<string> { "/images/health-screening.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Small Business Development Workshop",
                Description = "Learn how to start and grow your business. Topics include funding, marketing, and legal compliance.",
                Category = EventCategory.Other,
                Location = "ICC Durban",
                StartsAt = baseDate.AddDays(12).AddHours(9),
                EndsAt = baseDate.AddDays(12).AddHours(16),
                Status = EventStatus.Published,
                RequiresRegistration = true,
                MaxAttendees = 100,
                ContactInfo = "business@durban.gov.za",
                MediaUrls = new List<string> { "/images/business-workshop.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Recycling Awareness Day",
                Description = "Learn about recycling and waste management. Drop off recyclables and get free reusable bags.",
                Category = EventCategory.Environment,
                Location = "Durban Solid Waste Depot",
                StartsAt = baseDate.AddDays(8).AddHours(7),
                EndsAt = baseDate.AddDays(8).AddHours(13),
                Status = EventStatus.Published,
                RequiresRegistration = false,
                MaxAttendees = 0,
                ContactInfo = "waste@durban.gov.za",
                MediaUrls = new List<string> { "/images/recycling.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Digital Skills Training",
                Description = "Free computer training for beginners. Learn basic Microsoft Office and internet skills.",
                Category = EventCategory.Education,
                Location = "Durban Central Library",
                StartsAt = baseDate.AddDays(15).AddHours(9),
                EndsAt = baseDate.AddDays(15).AddHours(13),
                Status = EventStatus.Published,
                RequiresRegistration = true,
                MaxAttendees = 30,
                ContactInfo = "library@durban.gov.za",
                MediaUrls = new List<string> { "/images/digital-skills.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Fire Safety Demonstration",
                Description = "Learn how to prevent and respond to fires. Demonstrations of fire extinguisher use and evacuation procedures.",
                Category = EventCategory.Public_Safety,
                Location = "Durban Fire Station",
                StartsAt = baseDate.AddDays(18).AddHours(10),
                EndsAt = baseDate.AddDays(18).AddHours(12),
                Status = EventStatus.Published,
                RequiresRegistration = false,
                MaxAttendees = 0,
                ContactInfo = "fire@durban.gov.za",
                MediaUrls = new List<string> { "/images/fire-safety.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Community Garden Launch",
                Description = "Join the launch of our new community garden project. Learn about urban farming and get free seedlings.",
                Category = EventCategory.Community,
                Location = "Phoenix Community Park",
                StartsAt = baseDate.AddDays(9).AddHours(8),
                EndsAt = baseDate.AddDays(9).AddHours(11),
                Status = EventStatus.Published,
                RequiresRegistration = false,
                MaxAttendees = 0,
                ContactInfo = "parks@durban.gov.za",
                MediaUrls = new List<string> { "/images/garden.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Youth Leadership Summit",
                Description = "Empowering young leaders. Guest speakers, workshops, and networking opportunities for ages 16-25.",
                Category = EventCategory.Education,
                Location = "University of KwaZulu-Natal",
                StartsAt = baseDate.AddDays(30).AddHours(8),
                EndsAt = baseDate.AddDays(30).AddHours(17),
                Status = EventStatus.Published,
                RequiresRegistration = true,
                MaxAttendees = 250,
                ContactInfo = "youth@durban.gov.za",
                MediaUrls = new List<string> { "/images/leadership.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Emergency Preparedness Training",
                Description = "Learn how to prepare for natural disasters and emergencies. First aid training included.",
                Category = EventCategory.Public_Safety,
                Location = "Chatsworth Community Hall",
                StartsAt = baseDate.AddDays(20).AddHours(9),
                EndsAt = baseDate.AddDays(20).AddHours(15),
                Status = EventStatus.Published,
                RequiresRegistration = true,
                MaxAttendees = 80,
                ContactInfo = "emergency@durban.gov.za",
                MediaUrls = new List<string> { "/images/emergency.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Local Market & Craft Fair",
                Description = "Support local vendors and artists. Fresh produce, handmade crafts, and live entertainment.",
                Category = EventCategory.Community,
                Location = "Victoria Street Market",
                StartsAt = baseDate.AddDays(11).AddHours(7),
                EndsAt = baseDate.AddDays(11).AddHours(14),
                Status = EventStatus.Published,
                RequiresRegistration = false,
                MaxAttendees = 0,
                ContactInfo = "markets@durban.gov.za",
                MediaUrls = new List<string> { "/images/market.jpg" },
                CreatedAt = DateTime.UtcNow
            },
            new EventItem
            {
                Id = Guid.NewGuid(),
                Title = "Women in Business Conference",
                Description = "Empowering women entrepreneurs. Networking, mentorship, and access to funding opportunities.",
                Category = EventCategory.Other,
                Location = "Durban ICC",
                StartsAt = baseDate.AddDays(25).AddHours(8),
                EndsAt = baseDate.AddDays(25).AddHours(17),
                Status = EventStatus.Published,
                RequiresRegistration = true,
                MaxAttendees = 300,
                ContactInfo = "women.business@durban.gov.za",
                MediaUrls = new List<string> { "/images/women-business.jpg" },
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var eventItem in events)
        {
            AddEvent(eventItem);
        }
    }
}
