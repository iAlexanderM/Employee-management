using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddUserToPassTransactionV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Добавляем колонку 'UserId' как nullable
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                schema: "public",
                table: "PassTransactions",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE \"PassTransactions\" SET \"UserId\" = 'e055445e-9f91-4a29-a2ea-5830540823aa' WHERE \"UserId\" = '' OR \"UserId\" IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                schema: "public",
                table: "PassTransactions",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PassTransactions_UserId",
                schema: "public",
                table: "PassTransactions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PassTransactions_AspNetUsers_UserId",
                schema: "public",
                table: "PassTransactions",
                column: "UserId",
                principalSchema: "public",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PassTransactions_AspNetUsers_UserId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropIndex(
                name: "IX_PassTransactions_UserId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                schema: "public",
                table: "PassTransactions",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.DropColumn(
                name: "UserId",
                schema: "public",
                table: "PassTransactions");
        }
    }
}
