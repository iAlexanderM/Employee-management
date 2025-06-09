using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementServer.Models
{
    public class Pass
    {
        public int Id { get; set; }
        [Required]
        public string UniquePassId { get; set; } = string.Empty;
        public int PassTypeId { get; set; }
        [Required]
        public PassType PassType { get; set; } = null!;
        public int ContractorId { get; set; }
        public Contractor Contractor { get; set; } = null!;
        public int StoreId { get; set; }
        public Store Store { get; set; } = null!;
        public decimal Cost { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
        public string PassStatus { get; set; } = "Active";
        public string PrintStatus { get; set; } = "PendingPrint";
        public bool IsClosed { get; set; }
        public string? CloseReason { get; set; }
        public DateTime? CloseDate { get; set; }
        public string? ClosedByUserId { get; set; }
        [ForeignKey("ClosedByUserId")]
        public ApplicationUser? ClosedByUser { get; set; }
        public string? MainPhotoPath { get; set; }
        public string Position { get; set; } = string.Empty;
        [Column("PassTransactionId")]
        public int PassTransactionId { get; set; }
        public PassTransaction PassTransaction { get; set; } = null!;
    }
}