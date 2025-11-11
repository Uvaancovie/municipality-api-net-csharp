using System.ComponentModel.DataAnnotations;

namespace MunicipalApi.Models;

public class Admin
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(256)]
    public string Email { get; set; } = default!;

    [MaxLength(256)]
    public string PasswordHash { get; set; } = default!;

    [MaxLength(120)]
    public string Name { get; set; } = "Admin";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}
