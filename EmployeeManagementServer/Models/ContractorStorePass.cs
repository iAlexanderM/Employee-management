namespace EmployeeManagementServer.Models
{
    public class ContractorStorePass
    {
        public int Id { get; set; }
        public int ContractorId { get; set; }
        public Contractor Contractor { get; set; } = null!;
        public int StoreId { get; set; }
        public Store Store { get; set; } = null!;
        public int PassTypeId { get; set; }
        public PassType PassType { get; set; } = null!;
        public int PassTransactionId { get; set; }
        public PassTransaction PassTransaction { get; set; } = null!;
        public required string Position { get; set; }
        public int? OriginalPassId { get; set; }
    }
}
