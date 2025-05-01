using System;
using System.Collections.Generic;

namespace EmployeeManagementServer.Models
{
    public class Contractor
    {
        public int Id { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string MiddleName { get; set; }
        public required string Citizenship { get; set; }
        public required string Nationality { get; set; }
        public DateTime BirthDate { get; set; }
        public required string DocumentType { get; set; }
        public required string PassportSerialNumber { get; set; }
        public required string PassportIssuedBy { get; set; }
        public DateTime PassportIssueDate { get; set; }
        public required string PhoneNumber { get; set; }
        public required string ProductType { get; set; }
        public bool IsArchived { get; set; } = false;
        public string? Note { get; set; }
        public int? SortOrder { get; set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public ICollection<ContractorPhoto> Photos { get; set; } = new List<ContractorPhoto>();
        public ICollection<Pass> Passes { get; set; } = new List<Pass>();
        public ICollection<ContractorHistory> History { get; set; } = new List<ContractorHistory>();
    }
}