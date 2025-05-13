using EmployeeManagementServer.Models.DTOs;
using System.Text.Json;

namespace EmployeeManagementServer.Mappings
{
    public static class HistoryMappingHelper
    {
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public static Dictionary<string, ChangeValueDto> DeserializeChanges(string changesJson)
        {
            if (string.IsNullOrEmpty(changesJson))
                return new Dictionary<string, ChangeValueDto>();

            var result = JsonSerializer.Deserialize<Dictionary<string, ChangeValueDto>>(changesJson, JsonOptions)
                ?? new Dictionary<string, ChangeValueDto>();
            Console.WriteLine($"Deserialized ChangesJson={changesJson}, Result={JsonSerializer.Serialize(result, JsonOptions)}");
            return result;
        }

        public static string SerializeChanges(Dictionary<string, ChangeValueDto> changes)
        {
            if (changes == null || !changes.Any())
                return string.Empty;

            return JsonSerializer.Serialize(changes, JsonOptions);
        }
    }
}