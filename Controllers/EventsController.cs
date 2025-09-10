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
    private readonly SupabaseStorageService _storageService;
    private readonly ILogger<EventsController> _logger;

    public EventsController(
        AppDbContext db, 
        SupabaseStorageService storageService,
        ILogger<EventsController> logger)
    {
        _db = db;
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
                Status = EventStatus.Draft
            };
            
            _db.Events.Add(eventItem);
            await _db.SaveChangesAsync();
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
}
