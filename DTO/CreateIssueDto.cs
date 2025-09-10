using System.ComponentModel.DataAnnotations;

namespace MunicipalApi.DTOs;

public record CreateIssueDto(
    [Required, MaxLength(160)] string Title,
    [Required, MaxLength(2048)] string Description,
    [Required, MaxLength(160)] string Location,
    [Required, MaxLength(48)] string Category,
    List<string>? MediaUrls
);
