using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MunicipalApi.Data;
using MunicipalApi.DTO;
using MunicipalApi.Models;
using MunicipalApi.Services;

namespace MunicipalApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AdminAuthService _authService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        AppDbContext db,
        AdminAuthService authService,
        ILogger<AdminController> logger)
    {
        _db = db;
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AdminLoginResponse>> Login(AdminLoginDto loginDto)
    {
        try
        {
            var response = await _authService.LoginAsync(loginDto);
            
            if (response == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during admin login");
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    [HttpGet("issues")]
    public async Task<ActionResult<List<IssueWithMessagesDto>>> GetAllIssues(
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] string? sortBy = "date", // date, location
        [FromQuery] string? sortOrder = "desc") // asc, desc
    {
        try
        {
            var query = _db.Issues.AsQueryable();

            // Filter by status
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<IssueStatus>(status, true, out var statusEnum))
            {
                query = query.Where(i => i.Status == statusEnum);
            }

            // Filter by category
            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(i => i.Category == category);
            }

            // Sort
            query = sortBy?.ToLower() switch
            {
                "location" => sortOrder?.ToLower() == "asc" 
                    ? query.OrderBy(i => i.Location) 
                    : query.OrderByDescending(i => i.Location),
                _ => sortOrder?.ToLower() == "asc"
                    ? query.OrderBy(i => i.CreatedAt)
                    : query.OrderByDescending(i => i.CreatedAt)
            };

            var issues = await query.Take(500).ToListAsync();

            // Map to DTOs with messages
            var issueDtos = new List<IssueWithMessagesDto>();
            foreach (var issue in issues)
            {
                var messages = await _db.IssueMessages
                    .Where(m => m.IssueId == issue.Id)
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

                issueDtos.Add(new IssueWithMessagesDto
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
                });
            }

            return Ok(issueDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching admin issues");
            return StatusCode(500, new { message = "An error occurred while fetching issues" });
        }
    }

    [HttpPut("issues/{id:guid}")]
    public async Task<ActionResult<IssueWithMessagesDto>> UpdateIssue(Guid id, AdminUpdateIssueDto updateDto)
    {
        try
        {
            var issue = await _db.Issues.FindAsync(id);
            if (issue == null)
            {
                return NotFound(new { message = "Issue not found" });
            }

            // Log the update
            _logger.LogInformation($"Updating issue {id} from status {issue.Status} to {updateDto.Status}");

            // Update status
            var oldStatus = issue.Status;
            issue.Status = updateDto.Status;
            issue.UpdatedAt = DateTime.UtcNow;

            // Explicitly mark as modified (needed because of NoTracking)
            _db.Entry(issue).State = EntityState.Modified;

            // Add message if provided
            if (!string.IsNullOrWhiteSpace(updateDto.Message))
            {
                var message = new IssueMessage
                {
                    IssueId = issue.Id,
                    Message = updateDto.Message,
                    IsFromAdmin = true,
                    SenderName = "Admin",
                    CreatedAt = DateTime.UtcNow
                };

                _db.IssueMessages.Add(message);
            }

            // Add automatic status update message
            var statusMessage = new IssueMessage
            {
                IssueId = issue.Id,
                Message = $"Status updated from {oldStatus} to {updateDto.Status}",
                IsFromAdmin = true,
                SenderName = "System",
                CreatedAt = DateTime.UtcNow
            };

            _db.IssueMessages.Add(statusMessage);

            // Save changes
            var savedCount = await _db.SaveChangesAsync();
            _logger.LogInformation($"Saved {savedCount} changes to database");

            // Fetch updated issue with messages
            var messages = await _db.IssueMessages
                .Where(m => m.IssueId == issue.Id)
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

            _logger.LogInformation($"Issue {id} updated to status {updateDto.Status}");

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating issue {id}");
            return StatusCode(500, new { message = "An error occurred while updating the issue" });
        }
    }

    [HttpPost("issues/{id:guid}/messages")]
    public async Task<ActionResult<MessageDto>> SendMessage(Guid id, [FromBody] string message)
    {
        try
        {
            var issue = await _db.Issues.FindAsync(id);
            if (issue == null)
            {
                return NotFound(new { message = "Issue not found" });
            }

            var issueMessage = new IssueMessage
            {
                IssueId = id,
                Message = message,
                IsFromAdmin = true,
                SenderName = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            _db.IssueMessages.Add(issueMessage);
            await _db.SaveChangesAsync();

            var messageDto = new MessageDto
            {
                Id = issueMessage.Id,
                Message = issueMessage.Message,
                IsFromAdmin = issueMessage.IsFromAdmin,
                SenderName = issueMessage.SenderName,
                CreatedAt = issueMessage.CreatedAt
            };

            return Ok(messageDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending message for issue {id}");
            return StatusCode(500, new { message = "An error occurred while sending the message" });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetStats()
    {
        try
        {
            var total = await _db.Issues.CountAsync();
            var submitted = await _db.Issues.CountAsync(i => i.Status == IssueStatus.Submitted);
            var inProgress = await _db.Issues.CountAsync(i => i.Status == IssueStatus.InProgress);
            var resolved = await _db.Issues.CountAsync(i => i.Status == IssueStatus.Resolved);
            var closed = await _db.Issues.CountAsync(i => i.Status == IssueStatus.Closed);

            var categoryStats = await _db.Issues
                .GroupBy(i => i.Category)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                total,
                byStatus = new { submitted, inProgress, resolved, closed },
                byCategory = categoryStats
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching admin stats");
            return StatusCode(500, new { message = "An error occurred while fetching stats" });
        }
    }
}
