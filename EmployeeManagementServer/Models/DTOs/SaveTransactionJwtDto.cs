using System;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementServer.Models.DTOs
{
    public class SaveTransactionJwtDto
    {
        [Required]
        public string SignedToken { get; set; } = string.Empty;

        [Required]
        public int ContractorId { get; set; }

        [Required]
        public int StoreId { get; set; }

        [Required]
        public int PassTypeId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public string? Position { get; set; }
    }
}
