namespace EmployeeManagementServer.Models.DTOs
{
    public class PassByStoreResponseDto
    {
        public int StoreId { get; set; }
        public string? Building { get; set; } 
        public string? Floor { get; set; } 
        public string? Line { get; set; } 
        public string? StoreNumber { get; set; }
        public string? Note { get; set; }
        public List<ContractorPassesDto> Contractors { get; set; } = new List<ContractorPassesDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}