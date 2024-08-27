namespace EmployeeManagementServer.Models
{
    public class Store
    {
        public int Id { get; set; }
        public string Building { get; set; }
        public int Floor { get; set; }
        public string Line { get; set; }
        public string StoreNumber { get; set; }
        public bool IsArchived { get; set; } = false; 
    }
}