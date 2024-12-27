using System;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementServer.Models
{
    public class Pass
    {
        public int Id { get; set; }

        [Required]
        public string UniquePassId { get; set; } = string.Empty;

        // Связь с PassType
        public int PassTypeId { get; set; }
        public PassType PassType { get; set; } = null!;

        // Связь с Contractor
        public int ContractorId { get; set; }
        public Contractor Contractor { get; set; } = null!;

        // Связь с Store
        public int StoreId { get; set; }
        public Store Store { get; set; } = null!;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
        public bool IsClosed { get; set; }
        public string? CloseReason { get; set; }
        public string? MainPhotoPath { get; set; }
        public string Position { get; set; } = string.Empty;

        // Связь с PassTransaction (двунаправленная связь)
        public PassTransaction PassTransaction { get; set; } = null!;
    }
}
