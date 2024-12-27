namespace EmployeeManagementServer.Models.DTOs
{
    public class PassGroupDto
    {
        public string Name { get; set; } = string.Empty; // Название группы
        public string Description { get; set; } = string.Empty; // Описание группы
        public string Color { get; set; } = "#FFFFFF"; // Цвет для визуального выделения
    }
}
