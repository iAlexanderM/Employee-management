using System;
using System.Collections.Generic;

namespace EmployeeManagementServer.Models
{
    public class History
    {
        public int Id { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string ChangesJson { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        public string ChangedBy { get; set; } = "Unknown";
    }
}