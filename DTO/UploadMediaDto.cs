namespace MunicipalApi.DTOs;

public class UploadMediaDto
{
    public IFormFile[] Files { get; set; } = Array.Empty<IFormFile>();
}
