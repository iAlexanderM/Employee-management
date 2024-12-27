using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddPassTableAndGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsArchived",
                schema: "public",
                table: "PassGroups");

            migrationBuilder.AddColumn<string>(
                name: "Color",
                schema: "public",
                table: "PassTypes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "public",
                table: "PassTypes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                schema: "public",
                table: "PassGroups",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "public",
                table: "PassGroups",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                schema: "public",
                table: "PassTypes");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "public",
                table: "PassTypes");

            migrationBuilder.DropColumn(
                name: "Color",
                schema: "public",
                table: "PassGroups");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "public",
                table: "PassGroups");

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                schema: "public",
                table: "PassGroups",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
