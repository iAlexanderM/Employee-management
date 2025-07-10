using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace EmployeeManagementServer.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? MiddleName { get; set; }
        public ICollection<QueueToken> QueueTokens { get; set; } = new List<QueueToken>();
        public ICollection<PassTransaction> PassTransactions { get; set; } = new List<PassTransaction>();
    }
}
