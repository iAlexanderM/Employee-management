using System.Text.Json.Serialization;

namespace EmployeeManagementServer.Models.DTOs
{
    public class ChangeValueDto
    {
        [JsonPropertyName("oldValue")]
        public object? OldValue { get; set; }

        [JsonPropertyName("newValue")]
        public object? NewValue { get; set; }
    }
}