namespace EmployeeManagementServer.Models
{
    public class RefreshToken
    {
        public required string Token { get; set; }
        public required string UserId { get; set; }
        public DateTime LastActive { get; set; }
        public DateTime Expires { get; set; }
        public bool IsRevoked { get; set; }
    }

}
