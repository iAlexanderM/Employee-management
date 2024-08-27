namespace EmployeeManagementServer.Models
{
    public class ContractorPhoto
    {
        public int Id { get; set; }
        public byte[] Photo { get; set; }
        public bool IsDocumentPhoto { get; set; }

        public int ContractorId { get; set; }
        public Contractor Contractor { get; set; }
    }
}
