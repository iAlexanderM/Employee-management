using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class SeparatePhotosMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Photo",
                schema: "public",
                table: "ContractorPhotos");

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                schema: "public",
                table: "ContractorPhotos",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FilePath",
                schema: "public",
                table: "ContractorPhotos");

            migrationBuilder.AddColumn<byte[]>(
                name: "Photo",
                schema: "public",
                table: "ContractorPhotos",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);
        }
    }
}
