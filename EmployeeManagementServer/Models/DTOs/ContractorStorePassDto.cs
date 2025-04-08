namespace EmployeeManagementServer.Models.DTOs
{
    public class ContractorStorePassDto
    {
        public int ContractorId { get; set; }
        public Contractor Contractor { get; set; } = null!;
        public int StoreId { get; set; }
        public Store Store { get; set; } = null!;
        public int PassTypeId { get; set; }
        public PassType PassType { get; set; } = null!;
        public string? Position { get; set; }
    }
}
