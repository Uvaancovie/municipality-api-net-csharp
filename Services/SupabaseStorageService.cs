using MunicipalApi.Config;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace MunicipalApi.Services;

public class SupabaseStorageService
{
    private readonly SupabaseStorageConfig _config;
    private readonly HttpClient _httpClient;
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(SupabaseStorageConfig config, ILogger<SupabaseStorageService> logger)
    {
        _config = config;
        _logger = logger;
        _httpClient = new HttpClient();
        
        // Set authorization headers for Supabase API
        _httpClient.DefaultRequestHeaders.Add("apikey", _config.ApiKey);
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
        
        _logger.LogInformation($"Supabase storage service initialized with URL: {_config.StorageUrl}");
    }

    public async Task<string> UploadFileAsync(IFormFile file, string path = "")
    {
        try
        {
            _logger.LogInformation($"Starting file upload: {file.FileName}, Size: {file.Length} bytes, ContentType: {file.ContentType}");
            
            string fileName = $"{Guid.NewGuid()}_{file.FileName}";
            string filePath = string.IsNullOrEmpty(path) ? fileName : $"{path}/{fileName}";
            
            _logger.LogInformation($"Generated file path: {filePath}");

            // Read the file into a byte array
            using var stream = file.OpenReadStream();
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            byte[] fileBytes = memoryStream.ToArray();

            // Create the upload URL
            string uploadUrl = $"{_config.StorageUrl}/storage/v1/object/{_config.BucketName}/{filePath}";
            
            // Create content for upload
            using var content = new ByteArrayContent(fileBytes);
            content.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
            
            // Upload the file
            var response = await _httpClient.PostAsync(uploadUrl, content);
            
            if (!response.IsSuccessStatusCode)
            {
                string errorResponse = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Supabase storage error: {response.StatusCode}, {errorResponse}");
                throw new Exception($"Failed to upload file: {response.StatusCode}, {errorResponse}");
            }

            // Create public URL
            string publicUrl = $"{_config.StorageUrl}/storage/v1/object/public/{_config.BucketName}/{filePath}";
            
            _logger.LogInformation($"File uploaded successfully, URL: {publicUrl}");
            
            return publicUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to Supabase storage");
            throw;
        }
    }

    public async Task<List<string>> UploadFilesAsync(IList<IFormFile> files, string path = "")
    {
        var urls = new List<string>();
        foreach (var file in files)
        {
            var url = await UploadFileAsync(file, path);
            urls.Add(url);
        }
        return urls;
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        try
        {
            // Extract the file path from the URL
            Uri uri = new Uri(fileUrl);
            string path = uri.PathAndQuery;
            
            // Remove the public prefix if present
            int index = path.IndexOf($"/object/public/{_config.BucketName}/");
            if (index >= 0)
            {
                path = path.Substring(index + $"/object/public/{_config.BucketName}/".Length);
            }
            
            _logger.LogInformation($"Deleting file: {path}");
            
            // Create delete URL
            string deleteUrl = $"{_config.StorageUrl}/storage/v1/object/{_config.BucketName}/{path}";
            var response = await _httpClient.DeleteAsync(deleteUrl);
            
            if (!response.IsSuccessStatusCode)
            {
                string errorResponse = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Error deleting file: {response.StatusCode}, {errorResponse}");
                throw new Exception($"Failed to delete file: {response.StatusCode}, {errorResponse}");
            }
            
            _logger.LogInformation($"File deleted successfully: {path}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file from Supabase storage");
            throw;
        }
    }
}
