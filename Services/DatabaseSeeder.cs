using MunicipalApi.Data;
using MunicipalApi.Models;
using Microsoft.EntityFrameworkCore;

namespace MunicipalApi.Services;

public class DatabaseSeeder
{
    private readonly AppDbContext _db;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(AppDbContext db, ILogger<DatabaseSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            // Check if data already exists
            var issueCount = await _db.Issues.CountAsync();
            var eventCount = await _db.Events.CountAsync();

            if (issueCount > 0 || eventCount > 0)
            {
                _logger.LogInformation("Database already contains data. Skipping seed.");
                return;
            }

            _logger.LogInformation("🌱 Seeding database with test data...");

            await SeedIssuesAsync();
            await SeedEventsAsync();

            _logger.LogInformation("✅ Database seeding completed successfully!");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error seeding database");
        }
    }

    private async Task SeedIssuesAsync()
    {
        var issues = new List<Issue>
        {
            new Issue
            {
                Title = "Pothole on Main Street causing traffic hazards",
                Description = "Large pothole near the intersection of Main Street and Oak Avenue. Multiple vehicles have been damaged. Approximately 30cm deep and 50cm wide. Urgent repair needed as it's affecting daily commute.",
                Location = "Main Street & Oak Avenue, Durban Central",
                Category = "Roads",
                Status = IssueStatus.Submitted,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new Issue
            {
                Title = "Broken streetlight on Park Road",
                Description = "Streetlight pole #47 has been non-functional for over 2 weeks. Area becomes very dark at night, creating safety concerns for pedestrians and residents.",
                Location = "Park Road, Phoenix",
                Category = "Utilities",
                Status = IssueStatus.InProgress,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-15),
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new Issue
            {
                Title = "Overflowing waste bins at Beach Front",
                Description = "Multiple waste bins along the beach promenade are overflowing. Attracting seagulls and creating unpleasant smell. Needs immediate attention, especially during tourist season.",
                Location = "Beach Front Promenade, Durban",
                Category = "Sanitation",
                Status = IssueStatus.Submitted,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new Issue
            {
                Title = "Damaged playground equipment at Community Park",
                Description = "Swing set chain is broken and slide has sharp edges. Children's safety at risk. Park is used by many families daily and needs urgent repair or replacement.",
                Location = "Community Park, Umhlanga",
                Category = "Parks",
                Status = IssueStatus.Resolved,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new Issue
            {
                Title = "Water leak on River Street",
                Description = "Continuous water flow from underground pipe near house #123. Water pressure in nearby homes has decreased. Wasting significant amount of water daily.",
                Location = "River Street, Westville",
                Category = "Utilities",
                Status = IssueStatus.InProgress,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1589403650941-3e1fc8eb13dc?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                UpdatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new Issue
            {
                Title = "Illegal dumping near Industrial Area",
                Description = "Large amount of construction debris and household waste dumped illegally. Environmental hazard and attracting pests. Area needs cleaning and surveillance.",
                Location = "Industrial Area Access Road, Pinetown",
                Category = "Sanitation",
                Status = IssueStatus.Submitted,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new Issue
            {
                Title = "Graffiti on Municipal Building wall",
                Description = "Extensive graffiti vandalism on the south wall of the municipal library building. Requires professional cleaning and possibly repainting.",
                Location = "Municipal Library, Durban Central",
                Category = "Public Property",
                Status = IssueStatus.Submitted,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1610337673044-720471f83677?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new Issue
            {
                Title = "Storm drain blocked with debris",
                Description = "Storm drain at the corner of Hill Street completely blocked. Water pooling during rain, flooding nearby properties. Last rainfall caused damage to two homes.",
                Location = "Hill Street & Valley Road, Durban North",
                Category = "Roads",
                Status = IssueStatus.InProgress,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-8),
                UpdatedAt = DateTime.UtcNow.AddDays(-4)
            },
            new Issue
            {
                Title = "Missing stop sign at intersection",
                Description = "Stop sign removed or stolen at busy intersection. Multiple near-miss incidents reported. Urgent replacement needed for traffic safety.",
                Location = "Grove Avenue & Cedar Street, Phoenix",
                Category = "Roads",
                Status = IssueStatus.Resolved,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1569144654912-5f146d08b98b?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-12),
                UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new Issue
            {
                Title = "Stray dogs in residential area",
                Description = "Pack of 5-6 stray dogs roaming neighborhood. Aggressive behavior towards residents and pets. Animal control assistance needed urgently.",
                Location = "Sunset Crescent, Chatsworth",
                Category = "Public Safety",
                Status = IssueStatus.Submitted,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800" },
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        _db.Issues.AddRange(issues);
        await _db.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {issues.Count} issues");
    }

    private async Task SeedEventsAsync()
    {
        var now = DateTime.UtcNow;
        
        var events = new List<EventItem>
        {
            new EventItem
            {
                Title = "Community Clean-Up Day",
                Description = "Join us for our monthly community clean-up initiative! We'll be cleaning the beachfront and surrounding areas. All cleaning supplies provided. Refreshments will be served.",
                StartsAt = now.AddDays(7).Date.AddHours(9),
                EndsAt = now.AddDays(7).Date.AddHours(13),
                Location = "Beach Front Main Entrance, Durban",
                Category = EventCategory.Environment,
                Status = EventStatus.Published,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800" },
                ContactInfo = "cleanupteam@durban.gov.za",
                MaxAttendees = 100,
                RequiresRegistration = true,
                CreatedAt = now.AddDays(-14)
            },
            new EventItem
            {
                Title = "Town Hall Meeting - Infrastructure Development",
                Description = "Public meeting to discuss upcoming infrastructure projects including road improvements, water system upgrades, and new park developments. Your input matters!",
                StartsAt = now.AddDays(14).Date.AddHours(18),
                EndsAt = now.AddDays(14).Date.AddHours(20),
                Location = "City Hall Auditorium, Durban Central",
                Category = EventCategory.Government,
                Status = EventStatus.Published,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800" },
                ContactInfo = "townhall@durban.gov.za",
                MaxAttendees = 200,
                RequiresRegistration = true,
                CreatedAt = now.AddDays(-10)
            },
            new EventItem
            {
                Title = "Fire Safety Workshop for Residents",
                Description = "Learn essential fire safety skills including fire extinguisher use, evacuation procedures, and home fire prevention. Free workshop conducted by local fire department.",
                StartsAt = now.AddDays(5).Date.AddHours(14),
                EndsAt = now.AddDays(5).Date.AddHours(16),
                Location = "Community Center, Phoenix",
                Category = EventCategory.Public_Safety,
                Status = EventStatus.Published,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1605468863995-75f949317b96?w=800" },
                ContactInfo = "safety@durban.gov.za",
                MaxAttendees = 50,
                RequiresRegistration = true,
                CreatedAt = now.AddDays(-7)
            },
            new EventItem
            {
                Title = "Summer Festival at Municipal Park",
                Description = "Annual summer festival featuring live music, food vendors, kids activities, and local artisan market. Family-friendly event for all ages. Free admission!",
                StartsAt = now.AddDays(21).Date.AddHours(10),
                EndsAt = now.AddDays(21).Date.AddHours(18),
                Location = "Municipal Park, Umhlanga",
                Category = EventCategory.Recreation,
                Status = EventStatus.Published,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800" },
                ContactInfo = "events@durban.gov.za",
                MaxAttendees = 0, // Unlimited
                RequiresRegistration = false,
                CreatedAt = now.AddDays(-20)
            },
            new EventItem
            {
                Title = "Free Health Screening Clinic",
                Description = "Free health screenings including blood pressure, diabetes testing, and general health consultation. Brought to you by the Municipal Health Department.",
                StartsAt = now.AddDays(10).Date.AddHours(8),
                EndsAt = now.AddDays(10).Date.AddHours(14),
                Location = "Community Clinic, Chatsworth",
                Category = EventCategory.Health,
                Status = EventStatus.Published,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800" },
                ContactInfo = "health@durban.gov.za",
                MaxAttendees = 80,
                RequiresRegistration = true,
                CreatedAt = now.AddDays(-5)
            },
            new EventItem
            {
                Title = "Youth Sports Tournament",
                Description = "Annual inter-school sports competition featuring soccer, basketball, and athletics. Open to all schools in the municipality. Prizes and refreshments for all participants.",
                StartsAt = now.AddDays(28).Date.AddHours(9),
                EndsAt = now.AddDays(28).Date.AddHours(16),
                Location = "Municipal Sports Complex, Durban North",
                Category = EventCategory.Recreation,
                Status = EventStatus.Published,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800" },
                ContactInfo = "sports@durban.gov.za",
                MaxAttendees = 300,
                RequiresRegistration = true,
                CreatedAt = now.AddDays(-25)
            },
            new EventItem
            {
                Title = "Tree Planting Initiative",
                Description = "Help us plant 500 trees across the municipality! Part of our Green City initiative. Saplings, tools, and guidance provided. Make a lasting environmental impact.",
                StartsAt = now.AddDays(15).Date.AddHours(7),
                EndsAt = now.AddDays(15).Date.AddHours(12),
                Location = "Various locations - meet at City Hall",
                Category = EventCategory.Environment,
                Status = EventStatus.Published,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800" },
                ContactInfo = "green@durban.gov.za",
                MaxAttendees = 150,
                RequiresRegistration = true,
                CreatedAt = now.AddDays(-12)
            },
            new EventItem
            {
                Title = "Senior Citizens Social Gathering",
                Description = "Monthly social event for senior citizens featuring tea, entertainment, and activities. Great opportunity to meet neighbors and make new friends.",
                StartsAt = now.AddDays(4).Date.AddHours(14),
                EndsAt = now.AddDays(4).Date.AddHours(16),
                Location = "Senior Center, Westville",
                Category = EventCategory.Community,
                Status = EventStatus.Published,
                MediaUrls = new List<string> { "https://images.unsplash.com/photo-1516450137517-162bfbeb8dba?w=800" },
                ContactInfo = "seniors@durban.gov.za",
                MaxAttendees = 60,
                RequiresRegistration = false,
                CreatedAt = now.AddDays(-8)
            }
        };

        _db.Events.AddRange(events);
        await _db.SaveChangesAsync();
        _logger.LogInformation($"✅ Seeded {events.Count} events");
    }
}
