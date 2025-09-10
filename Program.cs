using Microsoft.EntityFrameworkCore;
using MunicipalApi.Config;
using MunicipalApi.Data;
using MunicipalApi.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure database based on provider setting
var databaseProvider = builder.Configuration.GetValue<string>("DatabaseProvider") ?? "PostgreSQL";

if (databaseProvider.Equals("SQLite", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(
            builder.Configuration.GetConnectionString("SqliteConnection"),
            sqliteOptions => sqliteOptions.CommandTimeout(30))
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
            .EnableDetailedErrors(builder.Environment.IsDevelopment()));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null);
                npgsqlOptions.CommandTimeout(60);
            })
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
            .EnableDetailedErrors(builder.Environment.IsDevelopment())
            .LogTo(Console.WriteLine, LogLevel.Information));
}

// Configure Supabase storage
builder.Services.Configure<SupabaseStorageConfig>(
    builder.Configuration.GetSection("SupabaseStorage"));
    
builder.Services.AddSingleton(sp => 
    sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<SupabaseStorageConfig>>().Value);
builder.Services.AddSingleton<SupabaseStorageService>();
builder.Services.AddScoped<DatabaseConnectionService>();
builder.Services.AddScoped<SimpleConnectionTestService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "database");
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("allow_frontend", p => p
        .WithOrigins("http://localhost:5173", "http://localhost:3000") // Vite dev and Next.js dev
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("allow_frontend");
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

// Map health check endpoints
app.MapHealthChecks("/health");

app.Run();
