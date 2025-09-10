using System.ComponentModel.DataAnnotations;

namespace MunicipalApi.Models;

public enum IssueStatus { Submitted, Triaged, Assigned, InProgress, Resolved, Closed }

public class Issue
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(160)] public string Title { get; set; } = default!;
    [MaxLength(2048)] public string Description { get; set; } = default!;

    [MaxLength(160)] public string Location { get; set; } = default!; // e.g., "Phoenix, Durban"
    [MaxLength(48)] public string Category { get; set; } = default!;  // "Sanitation", "Roads", "Utilities"

    // SQLite compatible: List<string> will be serialized to JSON or comma-separated
    public List<string> MediaUrls { get; set; } = new();

    public IssueStatus Status { get; set; } = IssueStatus.Submitted;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
