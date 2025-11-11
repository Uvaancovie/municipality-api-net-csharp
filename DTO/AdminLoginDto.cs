using System.ComponentModel.DataAnnotations;

namespace MunicipalApi.DTO;

public class AdminLoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = default!;

    [Required]
    public string Password { get; set; } = default!;
}

public class AdminLoginResponse
{
    public string Token { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Name { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
}
