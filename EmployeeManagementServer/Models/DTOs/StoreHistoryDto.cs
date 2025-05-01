namespace EmployeeManagementServer.Models.DTOs
{
    public class StoreHistoryDto
    {
        public int Id { get; set; }
        public string FieldName { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public DateTime ChangedAt { get; set; }
        public string ChangedBy { get; set; }
    }
}
