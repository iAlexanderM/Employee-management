﻿using System;
using System.Collections.Generic;

namespace EmployeeManagementServer.Models
{
    public class Contractor
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string MiddleName { get; set; }
        public string Citizenship { get; set; }
        public string Nationality { get; set; }
        public DateTime BirthDate { get; set; }
        public string DocumentType { get; set; }
        public string PassportSerialNumber { get; set; }
        public string PassportIssuedBy { get; set; }
        public DateTime PassportIssueDate { get; set; }
        public string ProductType { get; set; }
        public bool IsArchived { get; set; } = false;

        // Связь с фотографиями
        public ICollection<ContractorPhoto> Photos { get; set; } = new List<ContractorPhoto>();
    }
}