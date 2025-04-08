using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementServer.Models.DTOs
{
    public class CreateTransactionDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;
        [Required]
        public List<ContractorStorePassCreateDto> ContractorStorePasses { get; set; } = new List<ContractorStorePassCreateDto>();
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        public string? Position { get; set; }
    }
}
