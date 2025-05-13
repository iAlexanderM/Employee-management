﻿namespace EmployeeManagementServer.Models.DTOs
{
    public class ContractorSearchDto
    {
        public int? Id { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? MiddleName { get; set; }
        public DateTime? BirthDate { get; set; }
        public string? PassportSerialNumber { get; set; }
        public string? PassportIssuedBy { get; set; }
        public DateTime? PassportIssueDate { get; set; }
        public string? ProductType { get; set; }
        public string? PhoneNumber { get; set; }
        public bool? IsArchived { get; set; }
    }
}