using EmployeeManagementServer.Models.EmployeeManagementServer.Models;

namespace EmployeeManagementServer.Models
{
    public class PassType
    {
        public int Id { get; set; } 
        public string Name { get; set; } = string.Empty;
        public int DurationInMonths { get; set; } 
        public required decimal Cost { get; set; } 
        public string PrintTemplate { get; set; } = string.Empty; 
        public bool IsArchived { get; set; } = false; 
        public int SortOrder { get; set; } = 0;
        public string Color { get; set; } = "#FFFFFF";
        public int PassGroupId { get; set; } 
        public PassGroup PassGroup { get; set; } = null!; 
    }
}