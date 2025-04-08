namespace EmployeeManagementServer.Models.DTOs
{
    public class PassTransactionResponseDto
    {
        public int Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public string TokenType { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;
        public List<ContractorStorePassDto> ContractorStorePasses { get; set; } = new List<ContractorStorePassDto>();
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Ожидает оплату";
        public DateTime CreatedAt { get; set; }
        public string Position { get; set; } = string.Empty;
        public int? PassId { get; set; }
        public DateTime? PaymentDate { get; set; }
    }
}
