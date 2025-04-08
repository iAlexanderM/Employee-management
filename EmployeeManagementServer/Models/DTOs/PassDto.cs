namespace EmployeeManagementServer.Models.DTOs
{
    public class PassDto
    {
        public int ContractorId { get; set; }
        public int StoreId { get; set; }
        public int PassTypeId { get; set; }
        public DateTime StartDate { get; set; }
        public int DurationInMonths { get; set; }
        public string Position { get; set; }
        public string? CloseReason { get; set; }
    }
}
