namespace EmployeeManagementServer.Models.DTOs
{
    public class StoreDto
    {
        public int Id { get; set; }
        public required string Building { get; set; }
        public required string Floor { get; set; }
        public required string Line { get; set; }
        public required string StoreNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? SortOrder { get; set; }
        public bool IsArchived { get; set; }
        public List<StoreHistoryDto> History { get; set; } = new List<StoreHistoryDto>();
    }
}