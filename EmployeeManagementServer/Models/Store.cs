namespace EmployeeManagementServer.Models
{
    public class Store
    {
        public int Id { get; set; }
        public string Building { get; set; }
        public string Floor { get; set; }
        public string Line { get; set; }
        public string StoreNumber { get; set; }
        public bool IsArchived { get; set; } = false;
        public int? SortOrder { get; set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    }
}