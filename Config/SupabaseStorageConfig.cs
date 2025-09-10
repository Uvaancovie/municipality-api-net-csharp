namespace MunicipalApi.Config;

public class SupabaseStorageConfig
{
    public string StorageUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = "issues-media";
}
