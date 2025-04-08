namespace EmployeeManagementServer.Models.DTOs
{
    public class PassTypeDto
    {
        public string Name { get; set; } = string.Empty; // Название типа
        public int DurationInMonths { get; set; } 
        public int Cost { get; set; } // Стоимость
        public string PrintTemplate { get; set; } = string.Empty; // Шаблон для печати
        public int SortOrder { get; set; } = 0; // Порядок отображения
        public string Color { get; set; } = "#FFFFFF"; // Цвет
        public int PassGroupId { get; set; } // ID группы пропусков
        public bool IsArchived { get; set; } = false;
    }
}
