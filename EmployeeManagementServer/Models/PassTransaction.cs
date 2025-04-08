using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace EmployeeManagementServer.Models
{
    public class PassTransaction
    {
        public int Id { get; set; }
        [Required]
        public string Token { get; set; } = string.Empty;
        [Required]
        public string TokenType { get; set; } = string.Empty;
        [Required]
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;
        public List<ContractorStorePass> ContractorStorePasses { get; set; } = new List<ContractorStorePass>();
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Amount { get; set; }
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Ожидает оплату";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Position { get; set; } = string.Empty;
        public int? PassId { get; set; }
        public DateTime? PaymentDate { get; set; }
        public ICollection<Pass> Passes { get; set; } = new List<Pass>();
    }
}