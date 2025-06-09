using System.ComponentModel.DataAnnotations.Schema;

namespace EmployeeManagementServer.Models.DTOs
{
    public class ContractorPhotoDto
    {
        public int Id { get; set; }
        public string? FilePath { get; set; }
        public bool IsDocumentPhoto { get; set; }
        public int ContractorId { get; set; }
        public Contractor? Contractor { get; set; }
    }
}
