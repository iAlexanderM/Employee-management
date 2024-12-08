namespace EmployeeManagementServer.Models
{
    public class Nationality
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int? SortOrder { get; set; }
        public bool IsArchived { get; set; } = false;
    }
}