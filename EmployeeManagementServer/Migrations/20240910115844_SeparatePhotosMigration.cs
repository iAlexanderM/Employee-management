using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

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

            migrationBuilder.CreateTable(
                name: "ContractorDocumentPhoto",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    ContractorId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractorDocumentPhoto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractorDocumentPhoto_Contractors_ContractorId",
                        column: x => x.ContractorId,
                        principalSchema: "public",
                        principalTable: "Contractors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContractorDocumentPhoto_ContractorId",
                schema: "public",
                table: "ContractorDocumentPhoto",
                column: "ContractorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContractorDocumentPhoto",
                schema: "public");

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
