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
		public string FirstName { get; set; }

		[Required(ErrorMessage = "Last name is required")]
		public string LastName { get; set; }

		public string MiddleName { get; set; }

        public DateTime BirthDate { get; set; }

        [Required(ErrorMessage = "Citizenship is required")]
        public string Citizenship { get; set; }

        [Required(ErrorMessage = "Nationality is required")]
        public string Nationality { get; set; }

        [Required(ErrorMessage = "Document type is required")]
		public string DocumentType { get; set; }

		[Required(ErrorMessage = "Passport serial number is required")]
		public string PassportSerialNumber { get; set; }

		[Required(ErrorMessage = "Passport issued by is required")]
        public string PassportIssuedBy { get; set; }

		public DateTime PassportIssueDate { get; set; }

		[Required(ErrorMessage = "Product type is required")]
		public string ProductType { get; set; }

		public List<IFormFile> Photos { get; set; } = new List<IFormFile>();
        public List<IFormFile> DocumentPhotos { get; set; } = new List<IFormFile>();
    }
}
