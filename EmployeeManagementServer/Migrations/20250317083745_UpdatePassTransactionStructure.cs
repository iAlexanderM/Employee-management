using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePassTransactionStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContractorIds",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropColumn(
                name: "PassTypeIds",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropColumn(
                name: "StoreIds",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.CreateTable(
                name: "ContractorStorePasses",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContractorId = table.Column<int>(type: "integer", nullable: false),
                    StoreId = table.Column<int>(type: "integer", nullable: false),
                    PassTypeId = table.Column<int>(type: "integer", nullable: false),
                    PassTransactionId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractorStorePasses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractorStorePasses_Contractors_ContractorId",
                        column: x => x.ContractorId,
                        principalSchema: "public",
                        principalTable: "Contractors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractorStorePasses_PassTransactions_PassTransactionId",
                        column: x => x.PassTransactionId,
                        principalSchema: "public",
                        principalTable: "PassTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContractorStorePasses_PassTypes_PassTypeId",
                        column: x => x.PassTypeId,
                        principalSchema: "public",
                        principalTable: "PassTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractorStorePasses_Stores_StoreId",
                        column: x => x.StoreId,
                        principalSchema: "public",
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContractorStorePasses_ContractorId",
                schema: "public",
                table: "ContractorStorePasses",
                column: "ContractorId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractorStorePasses_PassTransactionId",
                schema: "public",
                table: "ContractorStorePasses",
                column: "PassTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractorStorePasses_PassTypeId",
                schema: "public",
                table: "ContractorStorePasses",
                column: "PassTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractorStorePasses_StoreId",
                schema: "public",
                table: "ContractorStorePasses",
                column: "StoreId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContractorStorePasses",
                schema: "public");

            migrationBuilder.AddColumn<int[]>(
                name: "ContractorIds",
                schema: "public",
                table: "PassTransactions",
                type: "integer[]",
                nullable: false,
                defaultValue: new int[0]);

            migrationBuilder.AddColumn<int[]>(
                name: "PassTypeIds",
                schema: "public",
                table: "PassTransactions",
                type: "integer[]",
                nullable: false,
                defaultValue: new int[0]);

            migrationBuilder.AddColumn<int[]>(
                name: "StoreIds",
                schema: "public",
                table: "PassTransactions",
                type: "integer[]",
                nullable: false,
                defaultValue: new int[0]);
        }
    }
}
