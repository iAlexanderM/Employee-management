using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class FixPassTransactionId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PassTransactions_Passes_PassId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropIndex(
                name: "IX_PassTransactions_PassId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.AddColumn<int>(
                name: "PassTransactionId",
                schema: "public",
                table: "Passes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Passes_PassTransactionId",
                schema: "public",
                table: "Passes",
                column: "PassTransactionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_PassTransactions_PassTransactionId",
                schema: "public",
                table: "Passes",
                column: "PassTransactionId",
                principalSchema: "public",
                principalTable: "PassTransactions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Passes_PassTransactions_PassTransactionId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropIndex(
                name: "IX_Passes_PassTransactionId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropColumn(
                name: "PassTransactionId",
                schema: "public",
                table: "Passes");

            migrationBuilder.CreateIndex(
                name: "IX_PassTransactions_PassId",
                schema: "public",
                table: "PassTransactions",
                column: "PassId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PassTransactions_Passes_PassId",
                schema: "public",
                table: "PassTransactions",
                column: "PassId",
                principalSchema: "public",
                principalTable: "Passes",
                principalColumn: "Id");
        }
    }
}
