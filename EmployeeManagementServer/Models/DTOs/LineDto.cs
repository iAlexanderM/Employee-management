namespace EmployeeManagementServer.Models.DTOs
{
    public class LineDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int? SortOrder { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsArchived { get; set; }
    }
}
