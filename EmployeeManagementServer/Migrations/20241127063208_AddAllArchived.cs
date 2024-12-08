using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddAllArchived : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                schema: "public",
                table: "StoreNumbers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                schema: "public",
                table: "Nationalities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                schema: "public",
                table: "Lines",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                schema: "public",
                table: "Floors",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                schema: "public",
                table: "Citizenships",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                schema: "public",
                table: "Buildings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsArchived",
                schema: "public",
                table: "StoreNumbers");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                schema: "public",
                table: "Nationalities");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                schema: "public",
                table: "Lines");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                schema: "public",
                table: "Floors");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                schema: "public",
                table: "Citizenships");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                schema: "public",
                table: "Buildings");
        }
    }
}
