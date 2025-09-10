using Microsoft.AspNetCore.Mvc;
using MunicipalApi.Services;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace MunicipalApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StorageTestController : ControllerBase
{
    private readonly SupabaseStorageService _storageService;
    private readonly ILogger<StorageTestController> _logger;

    public StorageTestController(
        SupabaseStorageService storageService,
        ILogger<StorageTestController> logger)
    {
        _storageService = storageService;
        _logger = logger;
    }

    [HttpPost("test-upload")]
    public async Task<IActionResult> TestUpload(IFormFile file)
    {
        try
        {
            _logger.LogInformation("File upload request received");
            
            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("No file was uploaded or file is empty");
                return BadRequest(new { error = "No file uploaded or file is empty" });
            }
            
            _logger.LogInformation($"Processing file: {file.FileName}, Size: {file.Length} bytes");
            
            var url = await _storageService.UploadFileAsync(file, "test");
            
            _logger.LogInformation($"File uploaded successfully, URL: {url}");
            
            return Ok(new { fileUrl = url });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing file upload");
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }
}
