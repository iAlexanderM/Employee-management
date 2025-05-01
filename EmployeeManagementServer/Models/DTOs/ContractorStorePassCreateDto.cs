using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementServer.Models.DTOs
{
    public class ContractorStorePassCreateDto
    {
        [Required]
        public int ContractorId { get; set; }
        [Required]
        public int StoreId { get; set; }
        [Required]
        public int PassTypeId { get; set; }
        public string? Position { get; set; }
        public int? OriginalPassId { get; set; }
    }
}
