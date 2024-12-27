using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddPassTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CloseReasons",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CloseReasons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PassGroups",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PassGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PassTypes",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    DurationInDays = table.Column<int>(type: "integer", nullable: false),
                    Cost = table.Column<decimal>(type: "numeric", nullable: false),
                    PrintTemplate = table.Column<string>(type: "text", nullable: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    PassGroupId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PassTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PassTypes_PassGroups_PassGroupId",
                        column: x => x.PassGroupId,
                        principalSchema: "public",
                        principalTable: "PassGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Passes",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UniquePassId = table.Column<string>(type: "text", nullable: false),
                    PassTypeId = table.Column<int>(type: "integer", nullable: false),
                    ContractorId = table.Column<int>(type: "integer", nullable: false),
                    RetailPointId = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsClosed = table.Column<bool>(type: "boolean", nullable: false),
                    CloseReason = table.Column<string>(type: "text", nullable: true),
                    MainPhotoPath = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Passes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Passes_Contractors_ContractorId",
                        column: x => x.ContractorId,
                        principalSchema: "public",
                        principalTable: "Contractors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Passes_PassTypes_PassTypeId",
                        column: x => x.PassTypeId,
                        principalSchema: "public",
                        principalTable: "PassTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Passes_Stores_RetailPointId",
                        column: x => x.RetailPointId,
                        principalSchema: "public",
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Passes_ContractorId",
                schema: "public",
                table: "Passes",
                column: "ContractorId");

            migrationBuilder.CreateIndex(
                name: "IX_Passes_PassTypeId",
                schema: "public",
                table: "Passes",
                column: "PassTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Passes_RetailPointId",
                schema: "public",
                table: "Passes",
                column: "RetailPointId");

            migrationBuilder.CreateIndex(
                name: "IX_Passes_UniquePassId",
                schema: "public",
                table: "Passes",
                column: "UniquePassId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PassTypes_PassGroupId",
                schema: "public",
                table: "PassTypes",
                column: "PassGroupId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CloseReasons",
                schema: "public");

            migrationBuilder.DropTable(
                name: "Passes",
                schema: "public");

            migrationBuilder.DropTable(
                name: "PassTypes",
                schema: "public");

            migrationBuilder.DropTable(
                name: "PassGroups",
                schema: "public");
        }
    }
}
