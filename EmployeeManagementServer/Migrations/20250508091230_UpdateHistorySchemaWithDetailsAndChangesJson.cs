using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class UpdateHistorySchemaWithDetailsAndChangesJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PropertyName",
                schema: "public",
                table: "History",
                newName: "Details");

            migrationBuilder.RenameColumn(
                name: "OldValue",
                schema: "public",
                table: "History",
                newName: "ChangesJson");

            migrationBuilder.RenameColumn(
                name: "NewValue",
                schema: "public",
                table: "History",
                newName: "Action");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Details",
                schema: "public",
                table: "History",
                newName: "PropertyName");

            migrationBuilder.RenameColumn(
                name: "ChangesJson",
                schema: "public",
                table: "History",
                newName: "OldValue");

            migrationBuilder.RenameColumn(
                name: "Action",
                schema: "public",
                table: "History",
                newName: "NewValue");
        }
    }
}
