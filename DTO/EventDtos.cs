using MunicipalApi.Models;

namespace MunicipalApi.DTO;

public class CreateEventDto
{
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public DateTime StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public string Location { get; set; } = default!;
    public EventCategory Category { get; set; } = EventCategory.Community;
    public List<string>? MediaUrls { get; set; }
    public string? ContactInfo { get; set; }
    public int MaxAttendees { get; set; } = 0;
    public bool RequiresRegistration { get; set; } = false;
}

public class UpdateEventDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public string? Location { get; set; }
    public EventCategory? Category { get; set; }
    public List<string>? MediaUrls { get; set; }
    public string? ContactInfo { get; set; }
    public int? MaxAttendees { get; set; }
    public bool? RequiresRegistration { get; set; }
}

public class UpdateEventStatusDto
{
    public EventStatus Status { get; set; }
}
