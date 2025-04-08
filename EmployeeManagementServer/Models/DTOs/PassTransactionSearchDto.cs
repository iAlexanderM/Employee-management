namespace EmployeeManagementServer.Models.DTOs
{
    public class PassTransactionSearchDto
    {
        public string? Token { get; set; }
        public string? ContractorName { get; set; } 
        public int? ContractorId { get; set; }
        public string? StoreSearch { get; set; }
        public int? PassTypeId { get; set; }
        public DateTime? CreatedAfter { get; set; }
        public DateTime? CreatedBefore { get; set; }
        public string? UserName { get; set; } 
    }
}