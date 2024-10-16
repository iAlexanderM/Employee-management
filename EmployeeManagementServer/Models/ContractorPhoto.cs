using System.ComponentModel.DataAnnotations.Schema;

namespace EmployeeManagementServer.Models
{
    public class ContractorPhoto
    {
        public int Id { get; set; }
        public string? FilePath { get; set; }
        public bool IsDocumentPhoto { get; set; }
        public int ContractorId { get; set; }

        [ForeignKey("ContractorId")]
        public Contractor? Contractor { get; set; }
    }
}
