using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddCostToPass : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Cost",
                schema: "public",
                table: "Passes",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cost",
                schema: "public",
                table: "Passes");
        }
    }
}
