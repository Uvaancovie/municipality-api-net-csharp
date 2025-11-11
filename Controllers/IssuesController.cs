using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MunicipalApi.Data;
using MunicipalApi.DTO;
using MunicipalApi.DTOs;
using MunicipalApi.Models;
using MunicipalApi.Services;

namespace MunicipalApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IssuesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly CloudinaryStorageService _storageService;
    private readonly ILogger<IssuesController> _logger;

    public IssuesController(
        AppDbContext db, 
        CloudinaryStorageService storageService,
        ILogger<IssuesController> logger)
    {
        _db = db;
        _storageService = storageService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<Issue>> Create(CreateIssueDto dto)
    {
        try
        {
            var issue = new Issue
            {
                Title = dto.Title,
                Description = dto.Description,
                Location = dto.Location,
                Category = dto.Category,
                MediaUrls = dto.MediaUrls ?? new()
            };
            
            _db.Issues.Add(issue);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = issue.Id }, issue);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException is Microsoft.Data.Sqlite.SqliteException sqliteEx && sqliteEx.SqliteExtendedErrorCode == 1555)
        {
            _logger.LogWarning("Constraint error when creating issue: {Message}", ex.Message);
            return Conflict(new { message = "An issue with this ID already exists. Please try again." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating issue: {Message}", ex.Message);
            return StatusCode(500, new { message = "An error occurred while creating the issue. Please try again." });
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
                _logger.LogWarning("No files uploaded");
                return BadRequest("No files uploaded");
            }

            _logger.LogInformation("Starting file upload process...");
            var urls = await _storageService.UploadFilesAsync(dto.Files, "issues");
            
            _logger.LogInformation($"Successfully uploaded {urls.Count} files");
            return Ok(urls);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading files");
            return StatusCode(500, new { error = ex.Message, details = ex.ToString() });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<IssueWithMessagesDto>> GetById(Guid id)
    {
        var issue = await _db.Issues.FirstOrDefaultAsync(i => i.Id == id);
            
        if (issue is null) return NotFound();

        // Get messages for this issue
        var messages = await _db.IssueMessages
            .Where(m => m.IssueId == id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                Message = m.Message,
                IsFromAdmin = m.IsFromAdmin,
                SenderName = m.SenderName,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();

        var response = new IssueWithMessagesDto
        {
            Id = issue.Id,
            Title = issue.Title,
            Description = issue.Description,
            Location = issue.Location,
            Category = issue.Category,
            MediaUrls = issue.MediaUrls,
            Status = issue.Status,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt,
            Messages = messages
        };
        
        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Issue>>> List([FromQuery] string? status, [FromQuery] string? category)
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            
            var q = _db.Issues.AsQueryable();
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<IssueStatus>(status, true, out var st))
                q = q.Where(x => x.Status == st);
            if (!string.IsNullOrWhiteSpace(category))
                q = q.Where(x => x.Category == category);
            
            var issues = await q
                .OrderByDescending(x => x.CreatedAt)
                .Take(100)
                .ToListAsync(cts.Token);
                
            return Ok(issues);
        }
        catch (OperationCanceledException)
        {
            _logger.LogError("Request timeout while fetching issues");
            return StatusCode(408, new { message = "Request timeout. Please try again." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching issues: {Message}", ex.Message);
            return StatusCode(500, new { message = "An error occurred while fetching issues. Please try again." });
        }
    }

    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<Issue>> UpdateStatus(Guid id, UpdateStatusDto dto)
    {
        var issue = await _db.Issues.FindAsync(id);
        if (issue is null) return NotFound();
        issue.Status = dto.Status;
        issue.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(issue);
    }
}
