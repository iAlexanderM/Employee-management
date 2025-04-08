namespace EmployeeManagementServer.Models
{
    public class StoreNumber
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public int? SortOrder { get; set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public bool IsArchived { get; set; } = false;
    }
}
