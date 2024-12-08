namespace EmployeeManagementServer.Models
{
    public class RefreshToken
    {
        public string Token { get; set; }
        public string UserId { get; set; }
        public DateTime LastActive { get; set; }
        public DateTime Expires { get; set; }
        public bool IsRevoked { get; set; }
    }

}
