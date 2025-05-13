using System;
using System.Collections.Generic;

namespace EmployeeManagementServer.Models.DTOs
{
    public class HistoryDto
    {
        public int Id { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public Dictionary<string, ChangeValueDto> Changes { get; set; } = new Dictionary<string, ChangeValueDto>();
        public DateTime ChangedAt { get; set; }
        public string ChangedBy { get; set; } = "Unknown";
    }
}