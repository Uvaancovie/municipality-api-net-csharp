using System.ComponentModel.DataAnnotations;
using MunicipalApi.Models;

namespace MunicipalApi.DTO;

public class AdminUpdateIssueDto
{
    [Required]
    public IssueStatus Status { get; set; }

    [MaxLength(2048)]
    public string? Message { get; set; }
}
