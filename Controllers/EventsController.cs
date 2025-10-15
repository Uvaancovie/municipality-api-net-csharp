using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MunicipalApi.Data;
using MunicipalApi.Models;
using MunicipalApi.DTO;
using MunicipalApi.DTOs;
using MunicipalApi.Services;

namespace MunicipalApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly EventService _eventService;
    private readonly SupabaseStorageService _storageService;
    private readonly ILogger<EventsController> _logger;

    public EventsController(
        AppDbContext db,
        EventService eventService,
        SupabaseStorageService storageService,
        ILogger<EventsController> logger)
    {
        _db = db;
        _eventService = eventService;
        _storageService = storageService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<EventItem>> Create(CreateEventDto dto)
    {
        try
        {
            var eventItem = new EventItem
            {
                Title = dto.Title,
                Description = dto.Description,
                StartsAt = dto.StartsAt,
                EndsAt = dto.EndsAt,
                Location = dto.Location,
                Category = dto.Category,
                MediaUrls = dto.MediaUrls ?? new(),
                ContactInfo = dto.ContactInfo,
                MaxAttendees = dto.MaxAttendees,
                RequiresRegistration = dto.RequiresRegistration,
                Status = EventStatus.Published // Set to Published so it appears in listings
            };
            
            // Add to database
            _db.Events.Add(eventItem);
            await _db.SaveChangesAsync();
            
            // Add to EventService for in-memory data structures (recommendations, search, etc.)
            _eventService.AddEvent(eventItem);
            
            return CreatedAtAction(nameof(GetById), new { id = eventItem.Id }, eventItem);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException?.Message?.Contains("duplicate key") == true)
        {
            _logger.LogWarning("Duplicate key error when creating event: {Message}", ex.Message);
            return Conflict(new { message = "An event with this ID already exists. Please try again." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating event: {Message}", ex.Message);
            return StatusCode(500, new { message = "An error occurred while creating the event. Please try again." });
        }
    }

    [HttpPost("upload-media")]
    public async Task<ActionResult<List<string>>> UploadMedia([FromForm] UploadMediaDto dto)
    {
        try
        {
            _logger.LogInformation($"Upload media request received with {dto.Files?.Length ?? 0} files");
            
            if (dto.Files == null || dto.Files.Length == 0)
            {
                return BadRequest(new { message = "No files provided" });
            }

            var uploadedUrls = new List<string>();

            foreach (var file in dto.Files)
            {
                if (file.Length > 0)
                {
                    var url = await _storageService.UploadFileAsync(file, "events");
                    uploadedUrls.Add(url);
                }
            }

            _logger.LogInformation($"Successfully uploaded {uploadedUrls.Count} files");
            return Ok(uploadedUrls);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading media: {Message}", ex.Message);
            return StatusCode(500, new { error = ex.Message, details = ex.ToString() });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventItem>> GetById(Guid id)
    {
        try
        {
            var eventItem = await _db.Events.FirstOrDefaultAsync(e => e.Id == id);
                
            if (eventItem is null) return NotFound();

            return Ok(eventItem);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event {Id}: {Message}", id, ex.Message);
            return StatusCode(500, new { message = "An error occurred while fetching the event." });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventItem>>> List(
        [FromQuery] string? status, 
        [FromQuery] string? category,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            
            var q = _db.Events.AsQueryable();
            
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<EventStatus>(status, true, out var st))
                q = q.Where(x => x.Status == st);
                
            if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<EventCategory>(category, true, out var cat))
                q = q.Where(x => x.Category == cat);
                
            if (fromDate.HasValue)
                q = q.Where(x => x.StartsAt >= fromDate.Value);
                
            if (toDate.HasValue)
                q = q.Where(x => x.StartsAt <= toDate.Value);
            
            var events = await q
                .OrderBy(x => x.StartsAt)
                .Take(100)
                .ToListAsync(cts.Token);
                
            return Ok(events);
        }
        catch (OperationCanceledException)
        {
            _logger.LogError("Request timeout while fetching events");
            return StatusCode(408, new { message = "Request timeout. Please try again." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching events: {Message}", ex.Message);
            return StatusCode(500, new { message = "An error occurred while fetching events. Please try again." });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EventItem>> Update(Guid id, UpdateEventDto dto)
    {
        try
        {
            var eventItem = await _db.Events.FindAsync(id);
            if (eventItem is null)
                return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Title))
                eventItem.Title = dto.Title;
            if (!string.IsNullOrWhiteSpace(dto.Description))
                eventItem.Description = dto.Description;
            if (dto.StartsAt.HasValue)
                eventItem.StartsAt = dto.StartsAt.Value;
            if (dto.EndsAt.HasValue)
                eventItem.EndsAt = dto.EndsAt.Value;
            if (!string.IsNullOrWhiteSpace(dto.Location))
                eventItem.Location = dto.Location;
            if (dto.Category.HasValue)
                eventItem.Category = dto.Category.Value;
            if (dto.MediaUrls is not null)
                eventItem.MediaUrls = dto.MediaUrls;
            if (dto.ContactInfo is not null)
                eventItem.ContactInfo = dto.ContactInfo;
            if (dto.MaxAttendees.HasValue)
                eventItem.MaxAttendees = dto.MaxAttendees.Value;
            if (dto.RequiresRegistration.HasValue)
                eventItem.RequiresRegistration = dto.RequiresRegistration.Value;

            eventItem.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(eventItem);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event {Id}: {Message}", id, ex.Message);
            return StatusCode(500, new { message = "An error occurred while updating the event." });
        }
    }

    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<EventItem>> UpdateStatus(Guid id, UpdateEventStatusDto dto)
    {
        try
        {
            var eventItem = await _db.Events.FindAsync(id);
            if (eventItem is null)
                return NotFound();

            eventItem.Status = dto.Status;
            eventItem.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(eventItem);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event status {Id}: {Message}", id, ex.Message);
            return StatusCode(500, new { message = "An error occurred while updating the event status." });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        try
        {
            var eventItem = await _db.Events.FindAsync(id);
            if (eventItem is null)
                return NotFound();

            _db.Events.Remove(eventItem);
            await _db.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting event {Id}: {Message}", id, ex.Message);
            return StatusCode(500, new { message = "An error occurred while deleting the event." });
        }
    }

    // ==================== PART 2: Advanced Data Structures & Recommendations ====================

    /// <summary>
    /// Get all events from EventService (uses SortedDictionary for chronological ordering)
    /// </summary>
    [HttpGet("service/all")]
    public ActionResult<List<EventItem>> GetAllFromService()
    {
        try
        {
            var events = _eventService.GetAllEvents();
            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting events from service");
            return StatusCode(500, new { message = "Error retrieving events" });
        }
    }

    /// <summary>
    /// Search events with filters (uses HashSet for O(1) category lookups)
    /// Query params: query, category, startDate, endDate
    /// </summary>
    [HttpGet("search")]
    public ActionResult<List<EventItem>> Search(
        [FromQuery] string? query = null,
        [FromQuery] string? category = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var results = _eventService.SearchEvents(query, category, startDate, endDate);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching events");
            return StatusCode(500, new { message = "Error searching events" });
        }
    }

    /// <summary>
    /// Get personalized recommendations based on user search history
    /// Uses Dictionary<string, int> to analyze search patterns
    /// </summary>
    [HttpGet("recommendations")]
    public ActionResult<object> GetRecommendations([FromQuery] int count = 5, [FromQuery] string? area = null)
    {
        try
        {
            var recommendations = _eventService.GetRecommendations(count, area);
            return Ok(new
            {
                message = "Based on your search history, you may like these events:",
                count = recommendations.Count,
                events = recommendations
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendations");
            return StatusCode(500, new { message = "Error generating recommendations" });
        }
    }

    /// <summary>
    /// Track a search query for recommendation engine
    /// Updates Dictionary<string, int> search frequency counter
    /// </summary>
    [HttpPost("track-search")]
    public ActionResult TrackSearch([FromBody] TrackSearchDto dto)
    {
        try
        {
            _eventService.TrackSearch(dto.Query);
            return Ok(new { message = "Search tracked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking search");
            return StatusCode(500, new { message = "Error tracking search" });
        }
    }

    /// <summary>
    /// Get recently viewed events (uses Stack<Event> - LIFO)
    /// </summary>
    [HttpGet("recently-viewed")]
    public ActionResult<List<EventItem>> GetRecentlyViewed([FromQuery] int count = 5)
    {
        try
        {
            var recent = _eventService.GetRecentlyViewed(count);
            return Ok(recent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recently viewed events");
            return StatusCode(500, new { message = "Error retrieving recently viewed events" });
        }
    }

    /// <summary>
    /// Get upcoming events (uses Queue<Event> - FIFO)
    /// </summary>
    [HttpGet("upcoming")]
    public ActionResult<List<EventItem>> GetUpcoming([FromQuery] int count = 10)
    {
        try
        {
            var upcoming = _eventService.GetUpcomingEvents(count);
            return Ok(upcoming);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting upcoming events");
            return StatusCode(500, new { message = "Error retrieving upcoming events" });
        }
    }

    /// <summary>
    /// Get all unique categories (uses HashSet<string>)
    /// </summary>
    [HttpGet("categories")]
    public ActionResult<List<string>> GetCategories()
    {
        try
        {
            var categories = _eventService.GetCategories();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return StatusCode(500, new { message = "Error retrieving categories" });
        }
    }

    /// <summary>
    /// Get location-based recommendations combining area and category preferences
    /// </summary>
    [HttpGet("recommendations/location")]
    public ActionResult<object> GetLocationBasedRecommendations([FromQuery] int count = 5, [FromQuery] string location = "", [FromQuery] string category = "")
    {
        try
        {
            var recommendations = _eventService.GetLocationBasedRecommendations(count, location, category);
            return Ok(new
            {
                message = $"Events recommended for {location}{(category != "all" ? $" in {category} category" : "")}",
                count = recommendations.Count,
                location = location,
                category = category,
                events = recommendations
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting location-based recommendations");
            return StatusCode(500, new { message = "Error generating location-based recommendations" });
        }
    }
}

/// <summary>
/// DTO for tracking search queries
/// </summary>
public class TrackSearchDto
{
    public string Query { get; set; } = string.Empty;
}
