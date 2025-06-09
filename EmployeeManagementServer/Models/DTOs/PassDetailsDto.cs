namespace EmployeeManagementServer.Models.DTOs
{
    public class PassDetailsDto
    {
        public int Id { get; set; }
        public string UniquePassId { get; set; } = string.Empty;
        public int PassTypeId { get; set; }
        public string PassTypeName { get; set; } = string.Empty;
        public string? PassTypeColor { get; set; }
        public string? PassTypeTerm { get; set; }  
        public string? PassTypeAccess { get; set; }
        public int PassTypeDurationInMonths { get; set; }
        public decimal Cost { get; set; }        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime TransactionDate { get; set; }
        public string ContractorName { get; set; } = string.Empty;
        public int? ContractorId { get; set; }
        public bool IsClosed { get; set; }
        public string? CloseReason { get; set; }
        public string? ClosedBy { get; set; }
        public string PassStatus { get; set; } = "Active";
        public string PrintStatus { get; set; } = "PendingPrint";
        public string? ContractorPhotoPath { get; set; }
        public string Position { get; set; } = string.Empty;
        public string? Building { get; set; }
        public string? Floor { get; set; }
        public string? Line { get; set; }
        public string? StoreNumber { get; set; }
        public int? StoreId { get; set; }
    }
}
