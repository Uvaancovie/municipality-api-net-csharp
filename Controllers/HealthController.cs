using Microsoft.AspNetCore.Mvc;
using MunicipalApi.Data;
using MunicipalApi.Services;
using Microsoft.EntityFrameworkCore;

namespace MunicipalApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly DatabaseConnectionService _dbService;
    private readonly SimpleConnectionTestService _simpleTestService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        AppDbContext context, 
        DatabaseConnectionService dbService, 
        SimpleConnectionTestService simpleTestService,
        IConfiguration configuration,
        ILogger<HealthController> logger)
    {
        _context = context;
        _dbService = dbService;
        _simpleTestService = simpleTestService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }

    [HttpGet("database")]
    public async Task<IActionResult> TestDatabaseConnection()
    {
        try
        {
            _logger.LogInformation("Starting comprehensive database connection test...");
            
            // Try the simple connection test with fallback
            var simpleConnectionResult = await _simpleTestService.TestConnectionWithFallback(_configuration);
            
            if (simpleConnectionResult)
            {
                _logger.LogInformation("Simple connection test passed, trying Entity Framework...");
                
                try
                {
                    var canConnect = await _context.Database.CanConnectAsync();
                    return Ok(new { 
                        status = "healthy", 
                        simpleConnection = simpleConnectionResult,
                        entityFrameworkConnection = canConnect,
                        timestamp = DateTime.UtcNow 
                    });
                }
                catch (Exception efEx)
                {
                    _logger.LogWarning(efEx, "Entity Framework connection failed, but simple connection worked");
                    return Ok(new { 
                        status = "partial", 
                        simpleConnection = simpleConnectionResult,
                        entityFrameworkConnection = false,
                        entityFrameworkError = efEx.Message,
                        timestamp = DateTime.UtcNow 
                    });
                }
            }
            else
            {
                return StatusCode(503, new { 
                    status = "unhealthy", 
                    message = "All connection methods failed",
                    timestamp = DateTime.UtcNow 
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(503, new { 
                status = "unhealthy", 
                message = ex.Message,
                timestamp = DateTime.UtcNow 
            });
        }
    }
}
