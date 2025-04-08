namespace EmployeeManagementServer.Models.DTOs
{
    public class PassByStoreResponseDto
    {
        public int StoreId { get; set; }
        public required string Building { get; set; }
        public required string Floor { get; set; }
        public required string Line { get; set; }
        public required string StoreNumber { get; set; }
        public List<PassDetailsDto> ActivePasses { get; set; } = new List<PassDetailsDto>();
        public List<PassDetailsDto> ClosedPasses { get; set; } = new List<PassDetailsDto>();
        public List<ContractorPassesDto> Contractors { get; set; } = new List<ContractorPassesDto>();
    }
}
