namespace EmployeeManagementServer.Models
{
    public class ContractorHistory
    {
        public int Id { get; set; }
        public int ContractorId { get; set; }
        public string FieldName { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public DateTime ChangedAt { get; set; } 
        public string ChangedBy { get; set; } 

        public Contractor Contractor { get; set; }
    }
}
