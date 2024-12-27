namespace EmployeeManagementServer.Models
{
    public class CloseReason
    {
        public int Id { get; set; } // Уникальный идентификатор
        public string Name { get; set; } = string.Empty; // Название причины
    }
}
