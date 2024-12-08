namespace EmployeeManagementServer.Models.DTOs
{
    public class StoreSearchDto
    {
        public int? Id { get; set; }
        public string? Building { get; set; }
        public string? Floor { get; set; }
        public string? Line { get; set; }
        public string? StoreNumber { get; set; }
        public bool? IsArchived { get; set; }

        public void Normalize()
        {
            Building = NormalizeString(Building);
            Floor = NormalizeString(Floor);
            Line = NormalizeString(Line);
            StoreNumber = NormalizeString(StoreNumber);
        }

        private string? NormalizeString(string? input)
        {
            return string.IsNullOrWhiteSpace(input) ? null : input.Trim();
        }
    }
}
