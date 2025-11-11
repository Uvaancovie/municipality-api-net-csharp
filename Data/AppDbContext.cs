using Microsoft.EntityFrameworkCore;
using MunicipalApi.Models;

namespace MunicipalApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Issue> Issues => Set<Issue>();
    public DbSet<EventItem> Events => Set<EventItem>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<IssueMessage> IssueMessages => Set<IssueMessage>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Issue entity configuration
        b.Entity<Issue>(e =>
        {
            // SQLite: Store List<string> as JSON
            e.Property(x => x.MediaUrls)
                .HasConversion(
                    v => string.Join("||", v),
                    v => v.Split("||", StringSplitOptions.RemoveEmptyEntries).ToList());
            
            e.Property(x => x.Status).HasConversion<string>();
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.Category);
            e.HasIndex(x => x.CreatedAt);
        });

        // EventItem entity configuration
        b.Entity<EventItem>(e =>
        {
            // SQLite: Store List<string> as delimited string
            e.Property(x => x.MediaUrls)
                .HasConversion(
                    v => string.Join("||", v),
                    v => v.Split("||", StringSplitOptions.RemoveEmptyEntries).ToList());
            
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.Category).HasConversion<string>();
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.Category);
            e.HasIndex(x => x.StartsAt);
            e.HasIndex(x => x.CreatedAt);
        });

        // Admin entity configuration
        b.Entity<Admin>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
        });

        // IssueMessage entity configuration
        b.Entity<IssueMessage>(e =>
        {
            e.HasOne(x => x.Issue)
                .WithMany()
                .HasForeignKey(x => x.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
            
            e.HasIndex(x => x.IssueId);
            e.HasIndex(x => x.CreatedAt);
        });
    }
}
