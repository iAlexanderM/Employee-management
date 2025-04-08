namespace EmployeeManagementServer.Models.DTOs
{
    public class ContractorPassesDto
    {
        public int ContractorId { get; set; }
        public required string ContractorName { get; set; }
        public string? ContractorPhotoPath { get; set; }    
        public string? DocumentPhotos { get; set; }      
        public string? PhoneNumber { get; set; }          
        public string? Citizenship { get; set; }     
        public string? ProductType { get; set; }     
        public List<PassDetailsDto> ActivePasses { get; set; } = new List<PassDetailsDto>();
        public List<PassDetailsDto> ClosedPasses { get; set; } = new List<PassDetailsDto>();
        public List<PassDetailsDto> AllActivePasses { get; set; } = new List<PassDetailsDto>();
    }
}
