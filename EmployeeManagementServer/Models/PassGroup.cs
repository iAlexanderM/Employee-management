using System.Diagnostics.Eventing.Reader;

namespace EmployeeManagementServer.Models
{
    namespace EmployeeManagementServer.Models
    {
        public class PassGroup
        {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string Color { get; set; } = "#FFFFFF";
            public ICollection<PassType> PassTypes { get; set; } = new List<PassType>();
        }
    }
}
