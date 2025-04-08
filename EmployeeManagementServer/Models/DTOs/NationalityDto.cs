namespace EmployeeManagementServer.Models.DTOs
{
    public class NationalityDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public int? SortOrder { get; set; }
        public bool IsArchived { get; set; }
    }
}
