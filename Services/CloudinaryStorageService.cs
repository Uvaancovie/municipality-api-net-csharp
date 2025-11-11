using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using MunicipalApi.Config;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace MunicipalApi.Services;

public class CloudinaryStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryStorageService> _logger;

    public CloudinaryStorageService(CloudinaryConfig config, ILogger<CloudinaryStorageService> logger)
    {
        _logger = logger;
        
        var account = new Account(
            config.CloudName,
            config.ApiKey,
            config.ApiSecret
        );
        
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true;
        
        _logger.LogInformation($"Cloudinary storage service initialized for cloud: {config.CloudName}");
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folder = "issues")
    {
        try
        {
            _logger.LogInformation($"Starting file upload: {file.FileName}, Size: {file.Length} bytes, ContentType: {file.ContentType}");
            
            if (file.Length == 0)
            {
                throw new Exception("File is empty");
            }

            // Generate unique filename
            string fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            
            using var stream = file.OpenReadStream();
            
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, stream),
                Folder = folder,
                UseFilename = true,
                UniqueFilename = false,
                Overwrite = false,
                Tags = "municipal,issue"
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.Error != null)
            {
                _logger.LogError($"Cloudinary upload error: {uploadResult.Error.Message}");
                throw new Exception($"Failed to upload file: {uploadResult.Error.Message}");
            }

            _logger.LogInformation($"File uploaded successfully, URL: {uploadResult.SecureUrl}");
            
            return uploadResult.SecureUrl.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to Cloudinary");
            throw;
        }
    }

    public async Task<List<string>> UploadFilesAsync(IList<IFormFile> files, string folder = "issues")
    {
        var urls = new List<string>();
        
        foreach (var file in files)
        {
            try
            {
                var url = await UploadFileAsync(file, folder);
                urls.Add(url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading file {file.FileName}");
                // Continue with other files even if one fails
            }
        }
        
        return urls;
    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            // Extract public_id from Cloudinary URL
            var uri = new Uri(fileUrl);
            var pathSegments = uri.AbsolutePath.Split('/');
            
            // Cloudinary URL format: .../upload/v{version}/{folder}/{public_id}.{ext}
            var publicId = string.Join("/", pathSegments.Skip(pathSegments.Length - 2));
            publicId = publicId.Substring(0, publicId.LastIndexOf('.'));
            
            _logger.LogInformation($"Deleting file with public_id: {publicId}");
            
            var deletionParams = new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image
            };
            
            var result = await _cloudinary.DestroyAsync(deletionParams);
            
            if (result.Result == "ok")
            {
                _logger.LogInformation($"File deleted successfully: {publicId}");
                return true;
            }
            
            _logger.LogWarning($"File deletion failed: {result.Result}");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file from Cloudinary");
            return false;
        }
    }
}
