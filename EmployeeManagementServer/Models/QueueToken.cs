using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EmployeeManagementServer.Models
{
    public class QueueToken
    {
        public int Id { get; set; }
        [Required]
        public string Token { get; set; } = string.Empty;
        [Required]
        public string TokenType { get; set; } = string.Empty;
        [Required]
        public string UserId { get; set; } = string.Empty;
        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; } = null!;
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Column(TypeName = "date")] 
        public DateTime CreatedDate { get; set; }
    }
}