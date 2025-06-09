using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace EmployeeManagementServer.Models.DTOs
{
    public class ContractorResponseDto
    {
        public int Id { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string MiddleName { get; set; }
        public DateTime BirthDate { get; set; }
        public required string Citizenship { get; set; }
        public required string Nationality { get; set; }
        public required string DocumentType { get; set; }
        public required string PassportSerialNumber { get; set; }
        public required string PassportIssuedBy { get; set; }
        public DateTime PassportIssueDate { get; set; }
        public required string PhoneNumber { get; set; }
        public required string ProductType { get; set; }
        public bool IsArchived { get; set; }
        public string? Note { get; set; }

        public List<ContractorPhotoDto> Photos { get; set; } = new List<ContractorPhotoDto>();
        public List<ContractorPhotoDto> DocumentPhotos { get; set; } = new List<ContractorPhotoDto>();

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; } 
        public int? SortOrder { get; set; }

        public List<PassDetailsDto> ActivePasses { get; set; } = new List<PassDetailsDto>();
        public List<PassDetailsDto> ClosedPasses { get; set; } = new List<PassDetailsDto>();
    }
}