using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MunicipalApi.Migrations
{
    /// <summary>
    /// Migration for tables manually created in Supabase
    /// </summary>
    public partial class ManuallyCreatedTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // These tables have already been created manually in Supabase
            // This migration is just to bring EF Core's model in sync with the database
            
            // Skip creation of tables since they already exist in Supabase
            migrationBuilder.Sql(@"
                -- Record that we're skipping these tables because they already exist
                -- This ensures EF Core knows about them without trying to create them
                SELECT 'Tables were manually created in Supabase' as Info;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop tables if migration is reverted
            migrationBuilder.DropTable(
                name: "issues");

            migrationBuilder.DropTable(
                name: "events");
        }
    }
}
