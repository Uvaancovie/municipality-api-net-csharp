using Microsoft.EntityFrameworkCore;
using MunicipalApi.Config;
using MunicipalApi.Data;
using MunicipalApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
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

// Configure Cloudinary storage
builder.Services.Configure<CloudinaryConfig>(
    builder.Configuration.GetSection("Cloudinary"));
    
builder.Services.AddSingleton(sp => 
    sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<CloudinaryConfig>>().Value);
builder.Services.AddSingleton<CloudinaryStorageService>();

// Configure JWT Authentication
builder.Services.Configure<JwtConfig>(
    builder.Configuration.GetSection("Jwt"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtConfig = builder.Configuration.GetSection("Jwt");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig["Issuer"],
            ValidAudience = jwtConfig["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtConfig["Key"]!))
        };
    });

builder.Services.AddAuthorization();

// Admin authentication service
builder.Services.AddScoped<AdminAuthService>();

builder.Services.AddScoped<DatabaseConnectionService>();
builder.Services.AddScoped<SimpleConnectionTestService>();

// Part 2: Register EventService as Singleton for in-memory data structures
builder.Services.AddSingleton<EventService>();

// Configure JSON serialization to use string names for enums instead of numbers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "database");
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("allow_frontend", p =>
    {
        p.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin))
            {
                return false;
            }

            if (origin.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
            {
                return uri.Host.Equals("municipality-frontend-orpin.vercel.app", StringComparison.OrdinalIgnoreCase)
                    || uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase);
            }

            return false;
        })
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

var app = builder.Build();

// Ensure default admin exists
using (var scope = app.Services.CreateScope())
{
    var authService = scope.ServiceProvider.GetRequiredService<AdminAuthService>();
    await authService.EnsureDefaultAdminExists();
}

app.UseCors("allow_frontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI();

// Landing page with API documentation
app.MapGet("/", () => Results.Content(@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Municipal Services API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 900px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #667eea;
            font-size: 2.5rem;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .badge {
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .subtitle {
            color: #6b7280;
            font-size: 1.1rem;
            margin-bottom: 30px;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #374151;
            font-size: 1.5rem;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .endpoints {
            display: grid;
            gap: 12px;
        }
        .endpoint {
            background: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 8px;
            transition: all 0.2s;
        }
        .endpoint:hover {
            background: #f3f4f6;
            transform: translateX(4px);
        }
        .method {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.75rem;
            margin-right: 10px;
        }
        .get { background: #dbeafe; color: #1e40af; }
        .post { background: #d1fae5; color: #065f46; }
        .put { background: #fef3c7; color: #92400e; }
        .delete { background: #fee2e2; color: #991b1b; }
        .path {
            font-family: 'Courier New', monospace;
            color: #4b5563;
            font-weight: 500;
        }
        .description {
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 8px;
        }
        .links {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 30px;
        }
        .link-button {
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .link-button:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .link-button.secondary {
            background: #10b981;
        }
        .link-button.secondary:hover {
            background: #059669;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .feature {
            background: #f0f4ff;
            padding: 20px;
            border-radius: 12px;
            border: 2px solid #e0e7ff;
        }
        .feature h3 {
            color: #667eea;
            font-size: 1.1rem;
            margin-bottom: 8px;
        }
        .feature p {
            color: #6b7280;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        .icon {
            font-size: 1.5rem;
        }
    </style>
</head>
<body>
    <div class='container'>
        <h1>
            <span class='icon'>🏛️</span>
            Municipal Services API
            <span class='badge'>ONLINE</span>
        </h1>
        <p class='subtitle'>Comprehensive REST API for managing municipal service requests, events, and administration</p>

        <div class='section'>
            <h2><span class='icon'>✨</span> Key Features</h2>
            <div class='features'>
                <div class='feature'>
                    <h3>🎫 Issue Reporting</h3>
                    <p>Citizens can submit, track, and manage service requests with media attachments</p>
                </div>
                <div class='feature'>
                    <h3>📅 Event Management</h3>
                    <p>Discover and search local municipal events with advanced filtering</p>
                </div>
                <div class='feature'>
                    <h3>👨‍💼 Admin Dashboard</h3>
                    <p>Secure JWT authentication for administrators to manage and respond to issues</p>
                </div>
                <div class='feature'>
                    <h3>☁️ Cloud Storage</h3>
                    <p>Cloudinary integration for reliable image and media file storage</p>
                </div>
            </div>
        </div>

        <div class='section'>
            <h2><span class='icon'>🔌</span> API Endpoints</h2>
            <div class='endpoints'>
                <div class='endpoint'>
                    <div>
                        <span class='method post'>POST</span>
                        <span class='path'>/api/issues</span>
                    </div>
                    <div class='description'>Submit a new service request with optional media attachments</div>
                </div>
                <div class='endpoint'>
                    <div>
                        <span class='method get'>GET</span>
                        <span class='path'>/api/issues</span>
                    </div>
                    <div class='description'>Retrieve all issues with optional status and category filters</div>
                </div>
                <div class='endpoint'>
                    <div>
                        <span class='method get'>GET</span>
                        <span class='path'>/api/issues/{id}</span>
                    </div>
                    <div class='description'>Get detailed information about a specific issue</div>
                </div>
                <div class='endpoint'>
                    <div>
                        <span class='method get'>GET</span>
                        <span class='path'>/api/events</span>
                    </div>
                    <div class='description'>Browse municipal events with search and filtering capabilities</div>
                </div>
                <div class='endpoint'>
                    <div>
                        <span class='method post'>POST</span>
                        <span class='path'>/api/admin/login</span>
                    </div>
                    <div class='description'>Admin authentication endpoint returning JWT token</div>
                </div>
                <div class='endpoint'>
                    <div>
                        <span class='method get'>GET</span>
                        <span class='path'>/api/admin/issues</span>
                    </div>
                    <div class='description'>🔒 Admin: View all issues with sorting and filtering</div>
                </div>
                <div class='endpoint'>
                    <div>
                        <span class='method put'>PUT</span>
                        <span class='path'>/api/admin/issues/{id}</span>
                    </div>
                    <div class='description'>🔒 Admin: Update issue status and add system messages</div>
                </div>
                <div class='endpoint'>
                    <div>
                        <span class='method post'>POST</span>
                        <span class='path'>/api/admin/issues/{id}/messages</span>
                    </div>
                    <div class='description'>🔒 Admin: Send feedback message to issue reporter</div>
                </div>
                <div class='endpoint'>
                    <div>
                        <span class='method get'>GET</span>
                        <span class='path'>/api/admin/stats</span>
                    </div>
                    <div class='description'>🔒 Admin: Get analytics dashboard statistics</div>
                </div>
            </div>
        </div>

        <div class='section'>
            <h2><span class='icon'>🛠️</span> Quick Start</h2>
            <div class='links'>
                <a href='/swagger' class='link-button'>
                    📚 API Documentation
                </a>
                <a href='/health' class='link-button secondary'>
                    ❤️ Health Check
                </a>
            </div>
        </div>

        <div class='section'>
            <p style='color: #9ca3af; font-size: 0.9rem;'>
                <strong>Tech Stack:</strong> ASP.NET Core 8 • Entity Framework Core • PostgreSQL/SQLite • JWT Authentication • Cloudinary
            </p>
            <p style='color: #9ca3af; font-size: 0.9rem; margin-top: 10px;'>
                <strong>Frontend:</strong> <a href='http://localhost:3000' style='color: #667eea; text-decoration: none;'>http://localhost:3000</a>
            </p>
        </div>
    </div>
</body>
</html>
", "text/html"));

app.MapControllers();

// Map health check endpoints
app.MapHealthChecks("/health");

app.Run();
