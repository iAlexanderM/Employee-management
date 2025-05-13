namespace EmployeeManagementServer.Models
{
    public class Store
    {
        public int Id { get; set; }
        public required string Building { get; set; }
        public required string Floor { get; set; }
        public required string Line { get; set; }
        public required string StoreNumber { get; set; }
        public bool IsArchived { get; set; } = false;
        public int? SortOrder { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;
    }
}