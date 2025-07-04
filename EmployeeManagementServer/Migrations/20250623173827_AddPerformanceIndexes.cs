using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_Passes_PassTransactionId",
                schema: "public",
                table: "Passes",
                newName: "idx_passes_pass_transaction_id");

            migrationBuilder.CreateIndex(
                name: "idx_queue_tokens_token",
                schema: "public",
                table: "QueueTokens",
                column: "Token");

            migrationBuilder.CreateIndex(
                name: "idx_queue_tokens_token_type",
                schema: "public",
                table: "QueueTokens",
                column: "TokenType");

            migrationBuilder.CreateIndex(
                name: "idx_pass_transactions_created_at",
                schema: "public",
                table: "PassTransactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "idx_pass_transactions_token",
                schema: "public",
                table: "PassTransactions",
                column: "Token");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_queue_tokens_token",
                schema: "public",
                table: "QueueTokens");

            migrationBuilder.DropIndex(
                name: "idx_queue_tokens_token_type",
                schema: "public",
                table: "QueueTokens");

            migrationBuilder.DropIndex(
                name: "idx_pass_transactions_created_at",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropIndex(
                name: "idx_pass_transactions_token",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.RenameIndex(
                name: "idx_passes_pass_transaction_id",
                schema: "public",
                table: "Passes",
                newName: "IX_Passes_PassTransactionId");
        }
    }
}
