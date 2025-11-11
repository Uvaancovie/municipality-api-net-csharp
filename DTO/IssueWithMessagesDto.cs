using MunicipalApi.Models;

namespace MunicipalApi.DTO;

public class IssueWithMessagesDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string Location { get; set; } = default!;
    public string Category { get; set; } = default!;
    public List<string> MediaUrls { get; set; } = new();
    public IssueStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<MessageDto> Messages { get; set; } = new();
}

public class MessageDto
{
    public Guid Id { get; set; }
    public string Message { get; set; } = default!;
    public bool IsFromAdmin { get; set; }
    public string SenderName { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
}
