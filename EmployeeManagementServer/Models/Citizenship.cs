namespace EmployeeManagementServer.Models
{
    public class Citizenship
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public int? SortOrder { get; set; }
        public bool IsArchived { get; set; } = false;
    }
}
