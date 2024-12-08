namespace EmployeeManagementServer.Models.DTOs
{
    public class CitizenshipDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int? SortOrder { get; set; }
        public bool IsArchived { get; set; }
    }
}
