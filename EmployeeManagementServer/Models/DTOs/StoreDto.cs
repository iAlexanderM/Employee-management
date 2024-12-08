namespace EmployeeManagementServer.Models.DTOs
{
    public class StoreDto
    {
        public int Id { get; set; }
        public string Building { get; set; }
        public string Floor { get; set; }
        public string Line { get; set; }
        public string StoreNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? SortOrder { get; set; }
        public bool IsArchived { get; set; }
    }
}