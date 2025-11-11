using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MunicipalApi.Config;
using MunicipalApi.Data;
using MunicipalApi.DTO;
using MunicipalApi.Models;

namespace MunicipalApi.Services;

public class JwtConfig
{
    public string Key { get; set; } = default!;
    public string Issuer { get; set; } = default!;
    public string Audience { get; set; } = default!;
    public int ExpiryMinutes { get; set; } = 120;
}

public class AdminAuthService
{
    private readonly AppDbContext _db;
    private readonly JwtConfig _jwtConfig;
    private readonly ILogger<AdminAuthService> _logger;

    public AdminAuthService(
        AppDbContext db,
        IOptions<JwtConfig> jwtConfig,
        ILogger<AdminAuthService> logger)
    {
        _db = db;
        _jwtConfig = jwtConfig.Value;
        _logger = logger;
    }

    public async Task<AdminLoginResponse?> LoginAsync(AdminLoginDto loginDto)
    {
        try
        {
            var admin = await _db.Admins
                .FirstOrDefaultAsync(a => a.Email == loginDto.Email);

            if (admin == null)
            {
                _logger.LogWarning($"Admin login failed: Email not found - {loginDto.Email}");
                return null;
            }

            // Verify password
            if (!VerifyPassword(loginDto.Password, admin.PasswordHash))
            {
                _logger.LogWarning($"Admin login failed: Invalid password for {loginDto.Email}");
                return null;
            }

            // Update last login
            admin.LastLoginAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            // Generate JWT token
            var token = GenerateJwtToken(admin);
            var expiresAt = DateTime.UtcNow.AddMinutes(_jwtConfig.ExpiryMinutes);

            _logger.LogInformation($"Admin logged in successfully: {admin.Email}");

            return new AdminLoginResponse
            {
                Token = token,
                Email = admin.Email,
                Name = admin.Name,
                ExpiresAt = expiresAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during admin login");
            return null;
        }
    }

    private string GenerateJwtToken(Admin admin)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtConfig.Key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
            new Claim(ClaimTypes.Email, admin.Email),
            new Claim(ClaimTypes.Name, admin.Name),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var token = new JwtSecurityToken(
            issuer: _jwtConfig.Issuer,
            audience: _jwtConfig.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtConfig.ExpiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        var hash = HashPassword(password);
        return hash == storedHash;
    }

    public async Task<bool> EnsureDefaultAdminExists()
    {
        try
        {
            var adminExists = await _db.Admins.AnyAsync();
            if (!adminExists)
            {
                var defaultAdmin = new Admin
                {
                    Email = "way2flyagency@gmail.com",
                    PasswordHash = HashPassword("way2flymillionaire"),
                    Name = "Admin",
                    CreatedAt = DateTime.UtcNow
                };

                _db.Admins.Add(defaultAdmin);
                await _db.SaveChangesAsync();
                
                _logger.LogInformation("Default admin account created successfully");
                return true;
            }
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating default admin");
            return false;
        }
    }
}
