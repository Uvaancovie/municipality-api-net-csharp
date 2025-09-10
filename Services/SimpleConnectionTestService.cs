using Npgsql;
using System.Data;

namespace MunicipalApi.Services;

public class SimpleConnectionTestService
{
    private readonly ILogger<SimpleConnectionTestService> _logger;

    public SimpleConnectionTestService(ILogger<SimpleConnectionTestService> logger)
    {
        _logger = logger;
    }

    public async Task<bool> TestConnectionWithFallback(IConfiguration configuration)
    {
        var connectionStrings = new[]
        {
            // Try direct connection first
            "Host=db.rmkgxmqklrxhvpfgyzsd.supabase.co;Port=5432;Database=postgres;Username=postgres.rmkgxmqklrxhvpfgyzsd;Password=way2flymillionaire;SSL Mode=Require;Trust Server Certificate=true;Timeout=120;Pooling=false",
            
            // Try session pooler
            "Host=aws-1-ap-southeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.rmkgxmqklrxhvpfgyzsd;Password=way2flymillionaire;SSL Mode=Require;Trust Server Certificate=true;Timeout=120;Pooling=false",
            
            // Try transaction pooler
            "Host=aws-1-ap-southeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.rmkgxmqklrxhvpfgyzsd;Password=way2flymillionaire;SSL Mode=Require;Trust Server Certificate=true;Timeout=120;Pooling=false"
        };

        var connectionNames = new[]
        {
            "Direct Connection",
            "Session Pooler",
            "Transaction Pooler"
        };

        for (int i = 0; i < connectionStrings.Length; i++)
        {
            try
            {
                _logger.LogInformation("Trying {ConnectionType}...", connectionNames[i]);
                
                var success = await TestSingleConnection(connectionStrings[i]);
                if (success)
                {
                    _logger.LogInformation("{ConnectionType} successful!", connectionNames[i]);
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("{ConnectionType} failed: {Message}", connectionNames[i], ex.Message);
            }
        }

        return false;
    }

    private async Task<bool> TestSingleConnection(string connectionString)
    {
        using var connection = new NpgsqlConnection(connectionString);
        
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(3));
        
        await connection.OpenAsync(cts.Token);
        
        using var command = new NpgsqlCommand("SELECT current_timestamp, version()", connection);
        command.CommandTimeout = 120;
        
        using var reader = await command.ExecuteReaderAsync(cts.Token);
        if (await reader.ReadAsync(cts.Token))
        {
            var timestamp = reader.GetDateTime(0);
            var version = reader.GetString(1);
            _logger.LogInformation("Database response - Time: {Time}, Version: {Version}", timestamp, version.Substring(0, Math.Min(50, version.Length)));
            return true;
        }
        
        return false;
    }
}
