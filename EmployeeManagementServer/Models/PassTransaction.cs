using System;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementServer.Models
{
    public class PassTransaction
    {
        public int Id { get; set; } // Уникальный идентификатор

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public string TokenType { get; set; } = string.Empty;

        // Связь с Contractor
        public int ContractorId { get; set; }
        public Contractor Contractor { get; set; } = null!;

        // Связь с User (ApplicationUser)
        [Required]
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        // Связь с Store
        public int StoreId { get; set; }
        public Store Store { get; set; } = null!;

        // Связь с PassType
        public int PassTypeId { get; set; }
        public PassType PassType { get; set; } = null!;

        public DateTime StartDate { get; set; } // Дата начала действия пропуска
        public DateTime EndDate { get; set; } // Дата окончания действия пропуска

        public int Amount { get; set; } // Сумма оплаты

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending"; // Статус транзакции (Pending, Paid, Active, Closed)

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Дата создания

        public string Position { get; set; } = string.Empty; // Дополнительная информация (например, должность)

        // Связь с Pass
        public int? PassId { get; set; }
        public Pass? Pass { get; set; }
    }
}
