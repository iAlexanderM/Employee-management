using EmployeeManagementServer.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

public interface IQueueService
{
    Task<bool> CloseActiveTokenAsync(string userId, string token);
}

public class QueueService : IQueueService
{
    private readonly ApplicationDbContext _context;

    public QueueService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> CloseActiveTokenAsync(string userId, string token)
    {
        var queueToken = await _context.QueueTokens
            .FirstOrDefaultAsync(q => q.Token == token && q.UserId == userId && q.Status == "Active");

        if (queueToken != null)
        {
            queueToken.Status = "Closed";
            _context.QueueTokens.Update(queueToken);
            await _context.SaveChangesAsync();

            return true;
        }

        return false;
    }
}