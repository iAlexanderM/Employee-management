namespace EmployeeManagementServer.Models.DTOs
{
    public class PassTypeDto
    {
        public string Name { get; set; } = string.Empty;
        public int DurationInMonths { get; set; } 
        public int Cost { get; set; } 
        public string PrintTemplate { get; set; } = string.Empty; 
        public int SortOrder { get; set; } = 0; 
        public string Color { get; set; } = "#FFFFFF"; 
        public int PassGroupId { get; set; }
        public bool IsArchived { get; set; } = false;
    }
}
