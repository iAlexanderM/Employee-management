using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePassStatusAndPrintStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                schema: "public",
                table: "Passes",
                newName: "PrintStatus");

            migrationBuilder.AddColumn<string>(
                name: "PassStatus",
                schema: "public",
                table: "Passes",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PassStatus",
                schema: "public",
                table: "Passes");

            migrationBuilder.RenameColumn(
                name: "PrintStatus",
                schema: "public",
                table: "Passes",
                newName: "Status");
        }
    }
}
