using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class PassTransactionAndStoreAndRemoveRetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Passes_Stores_RetailPointId",
                schema: "public",
                table: "Passes");

            migrationBuilder.RenameColumn(
                name: "RetailPointId",
                schema: "public",
                table: "Passes",
                newName: "StoreId");

            migrationBuilder.RenameIndex(
                name: "IX_Passes_RetailPointId",
                schema: "public",
                table: "Passes",
                newName: "IX_Passes_StoreId");

            migrationBuilder.CreateTable(
                name: "PassTransactions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Token = table.Column<string>(type: "text", nullable: false),
                    ContractorId = table.Column<int>(type: "integer", nullable: false),
                    StoreId = table.Column<int>(type: "integer", nullable: false),
                    PassTypeId = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PassTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PassTransactions_Contractors_ContractorId",
                        column: x => x.ContractorId,
                        principalSchema: "public",
                        principalTable: "Contractors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PassTransactions_PassTypes_PassTypeId",
                        column: x => x.PassTypeId,
                        principalSchema: "public",
                        principalTable: "PassTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PassTransactions_Stores_StoreId",
                        column: x => x.StoreId,
                        principalSchema: "public",
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PassTransactions_ContractorId",
                schema: "public",
                table: "PassTransactions",
                column: "ContractorId");

            migrationBuilder.CreateIndex(
                name: "IX_PassTransactions_PassTypeId",
                schema: "public",
                table: "PassTransactions",
                column: "PassTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PassTransactions_StoreId",
                schema: "public",
                table: "PassTransactions",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_PassTransactions_Token",
                schema: "public",
                table: "PassTransactions",
                column: "Token",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_Stores_StoreId",
                schema: "public",
                table: "Passes",
                column: "StoreId",
                principalSchema: "public",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Passes_Stores_StoreId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropTable(
                name: "PassTransactions",
                schema: "public");

            migrationBuilder.RenameColumn(
                name: "StoreId",
                schema: "public",
                table: "Passes",
                newName: "RetailPointId");

            migrationBuilder.RenameIndex(
                name: "IX_Passes_StoreId",
                schema: "public",
                table: "Passes",
                newName: "IX_Passes_RetailPointId");

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_Stores_RetailPointId",
                schema: "public",
                table: "Passes",
                column: "RetailPointId",
                principalSchema: "public",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
