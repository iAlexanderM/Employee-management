namespace EmployeeManagementServer.Models.DTOs
{
    public class PassByStoreSearchDto
    {
        public int? StoreId { get; set; }
        public string? Building { get; set; }
        public string? Floor { get; set; }
        public string? Line { get; set; }
        public string? StoreNumber { get; set; }
        public bool? ShowActive { get; set; } = true;
        public bool? ShowClosed { get; set; } = false;
        public string? Note { get; set; }
        public bool? IsArchived { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 100;

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