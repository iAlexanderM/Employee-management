namespace EmployeeManagementServer.Models
{
    public class StoreHistory
    {
        public int Id { get; set; }
        public int StoreId { get; set; }
        public string FieldName { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public DateTime ChangedAt { get; set; }
        public string ChangedBy { get; set; }

        public Store Store { get; set; }
    }
}
