using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementServer.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        public override string UserName { get; set; }

        [Required]
        public string PasswordHash { get; set; }
    }
}
