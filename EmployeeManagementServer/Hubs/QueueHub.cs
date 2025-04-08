using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace EmployeeManagementServer.Hubs
{
    public class QueueHub : Hub
    {
        public async Task Ping()
        {
            await Clients.Caller.SendAsync("Pong", "Hello from server!");
        }
    }
}
