using System.ComponentModel.DataAnnotations;

namespace MunicipalApi.Models;

public class IssueMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid IssueId { get; set; }
    public Issue? Issue { get; set; }

    [MaxLength(2048)]
    public string Message { get; set; } = default!;

    public bool IsFromAdmin { get; set; } = false;

    [MaxLength(120)]
    public string SenderName { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
