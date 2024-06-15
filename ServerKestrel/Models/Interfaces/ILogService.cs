using ServerKestrel.Models.Dtos.Log;
using System.Security.Claims;

namespace ServerKestrel.Models.Interfaces
{
    public interface ILogService
    {
        Task SaveNewLog(string UserName, string Description);
        Task<IEnumerable<GetLogDto>> GetLogsAsync();
        Task<IEnumerable<GetLogDto>> GetMyLogsAsync(ClaimsPrincipal User);

    }
}