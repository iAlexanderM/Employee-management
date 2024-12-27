using System.Diagnostics.Eventing.Reader;

namespace EmployeeManagementServer.Models
{
    namespace EmployeeManagementServer.Models
    {
        public class PassGroup
        {
            public int Id { get; set; } // Уникальный идентификатор группы
            public string Name { get; set; } = string.Empty; // Название группы
            public string Description { get; set; } = string.Empty; // Описание группы
            public string Color { get; set; } = "#FFFFFF"; // Цвет для визуального выделения
            public ICollection<PassType> PassTypes { get; set; } = new List<PassType>(); // Связанные типы пропусков
        }
    }
}
