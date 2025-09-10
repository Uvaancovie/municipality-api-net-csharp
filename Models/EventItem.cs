namespace MunicipalApi.Models;

public enum EventStatus
{
    Draft,
    Published,
    Cancelled,
    Completed
}

public enum EventCategory
{
    Community,
    Government,
    Public_Safety,
    Infrastructure,
    Health,
    Education,
    Recreation,
    Environment,
    Other
}

public class EventItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public DateTime StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public string Location { get; set; } = default!;
    public EventCategory Category { get; set; } = EventCategory.Community;
    public EventStatus Status { get; set; } = EventStatus.Draft;
    public List<string> MediaUrls { get; set; } = new();
    public string? ContactInfo { get; set; }
    public int MaxAttendees { get; set; } = 0; // 0 means unlimited
    public bool RequiresRegistration { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
