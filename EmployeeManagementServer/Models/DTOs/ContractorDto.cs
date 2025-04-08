using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace EmployeeManagementServer.Models.DTOs
{
	public class ContractorDto
	{
		public int Id { get; set; }

		[Required(ErrorMessage = "First name is required")]
		public required string FirstName { get; set; }

		[Required(ErrorMessage = "Last name is required")]
		public required string LastName { get; set; }

		public required string MiddleName { get; set; }

        public DateTime BirthDate { get; set; }

        [Required(ErrorMessage = "Citizenship is required")]
        public required string Citizenship { get; set; }

        [Required(ErrorMessage = "Nationality is required")]
        public required string Nationality { get; set; }

        [Required(ErrorMessage = "Document type is required")]
		public required string DocumentType { get; set; }

		[Required(ErrorMessage = "Passport serial number is required")]
		public required string PassportSerialNumber { get; set; }

		[Required(ErrorMessage = "Passport issued by is required")]
        public required string PassportIssuedBy { get; set; }

		public DateTime PassportIssueDate { get; set; }

        [Required(ErrorMessage = "Phone number is required")]
        public required string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Product type is required")]
		public required string ProductType { get; set; }

        public bool IsArchived { get; set; }

        public List<IFormFile> Photos { get; set; } = new List<IFormFile>();
        public List<IFormFile> DocumentPhotos { get; set; } = new List<IFormFile>();

        public List<int> PhotosToRemove { get; set; } = new List<int>();
        public List<int> DocumentPhotosToRemove { get; set; } = new List<int>();

        public DateTime CreatedAt { get; set; }

        public int? SortOrder { get; set; }

        public List<PassDetailsDto> ActivePasses { get; set; } = new List<PassDetailsDto>();
        public List<PassDetailsDto> ClosedPasses { get; set; } = new List<PassDetailsDto>();
    }
}
