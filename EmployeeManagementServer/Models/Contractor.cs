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

        // Связь с фотографиями
        public ICollection<ContractorPhoto> Photos { get; set; } = new List<ContractorPhoto>();
    }
}