using EmployeeManagementServer.Models.EmployeeManagementServer.Models;

namespace EmployeeManagementServer.Models
{
    public class PassType
    {
        public int Id { get; set; } // Уникальный идентификатор
        public string Name { get; set; } = string.Empty; // Название типа
        public int DurationInMonths { get; set; } 
        public int Cost { get; set; } 
        public string PrintTemplate { get; set; } = string.Empty; // Шаблон для печати
        public bool IsArchived { get; set; } = false; // Архивный тип или нет

        public int SortOrder { get; set; } = 0; // Порядок отображения
        public string Color { get; set; } = "#FFFFFF"; // Цвет для визуального выделения

        public int PassGroupId { get; set; } // ID группы
        public PassGroup PassGroup { get; set; } = null!; // Связь с группой
    }
}