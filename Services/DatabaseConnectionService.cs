using Npgsql;

namespace MunicipalApi.Services;

public class DatabaseConnectionService
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseConnectionService> _logger;

    public DatabaseConnectionService(IConfiguration configuration, ILogger<DatabaseConnectionService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        _logger = logger;
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            _logger.LogInformation("Testing database connection...");
            _logger.LogInformation("Connection string: {ConnectionString}", 
                _connectionString.Replace(_connectionString.Split("Password=")[1].Split(";")[0], "***"));

            // Try multiple connection attempts with different strategies
            for (int attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    _logger.LogInformation("Connection attempt {Attempt}/3", attempt);
                    
                    using var connection = new NpgsqlConnection(_connectionString);
                    
                    // Set a more aggressive timeout for each attempt
                    var timeoutSeconds = 30 + (attempt * 30); // 30s, 60s, 90s
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds));
                    
                    await connection.OpenAsync(cts.Token);
                    
                    using var command = new NpgsqlCommand("SELECT 1 as test_value", connection);
                    command.CommandTimeout = timeoutSeconds;
                    var result = await command.ExecuteScalarAsync(cts.Token);
                    
                    _logger.LogInformation("Database connection successful on attempt {Attempt}. Result: {Result}", attempt, result);
                    return true;
                }
                catch (Exception ex) when (attempt < 3)
                {
                    _logger.LogWarning("Connection attempt {Attempt} failed: {Message}. Retrying...", attempt, ex.Message);
                    await Task.Delay(2000 * attempt); // Progressive delay: 2s, 4s
                }
            }
            
            _logger.LogError("All connection attempts failed");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database connection failed: {Message}", ex.Message);
            return false;
        }
    }

    public async Task<string> GetConnectionInfoAsync()
    {
        try
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            
            using var command = new NpgsqlCommand("SELECT version(), current_database(), current_user", connection);
            using var reader = await command.ExecuteReaderAsync();
            
            if (await reader.ReadAsync())
            {
                return $"Version: {reader.GetString(0)}, Database: {reader.GetString(1)}, User: {reader.GetString(2)}";
            }
            
            return "Could not retrieve connection info";
        }
        catch (Exception ex)
        {
            return $"Error: {ex.Message}";
        }
    }
}
