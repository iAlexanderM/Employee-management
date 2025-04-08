namespace EmployeeManagementServer.Models.DTOs
{
    public class UserRegisterDto
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
        public required string Role { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
