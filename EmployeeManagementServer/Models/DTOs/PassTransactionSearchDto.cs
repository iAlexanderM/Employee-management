using System;

namespace EmployeeManagementServer.Models.DTOs
{
    public class PassTransactionSearchDto
    {
        public string? Token { get; set; }
        public int? ContractorId { get; set; }
        public int? StoreId { get; set; }
        public int? PassTypeId { get; set; }
        public DateTime? CreatedAfter { get; set; }
        public DateTime? CreatedBefore { get; set; }
    }
}
