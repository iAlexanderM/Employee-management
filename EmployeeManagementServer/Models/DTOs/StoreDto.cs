namespace EmployeeManagementServer.Models.DTOs
{
    public class StoreDto
    {
        public int Id { get; set; }
        public required string Building { get; set; }
        public required string Floor { get; set; }
        public required string Line { get; set; }
        public required string StoreNumber { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int? SortOrder { get; set; }
        public bool IsArchived { get; set; }
    }
}