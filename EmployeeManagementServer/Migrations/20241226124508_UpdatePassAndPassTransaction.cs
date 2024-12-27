using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePassAndPassTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Passes_Contractors_ContractorId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropForeignKey(
                name: "FK_Passes_PassTypes_PassTypeId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropForeignKey(
                name: "FK_Passes_Stores_StoreId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropForeignKey(
                name: "FK_PassTransactions_Contractors_ContractorId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_PassTransactions_PassTypes_PassTypeId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_PassTransactions_Stores_StoreId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                schema: "public",
                table: "PassTransactions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "PassId",
                schema: "public",
                table: "PassTransactions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PassTransactions_PassId",
                schema: "public",
                table: "PassTransactions",
                column: "PassId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_Contractors_ContractorId",
                schema: "public",
                table: "Passes",
                column: "ContractorId",
                principalSchema: "public",
                principalTable: "Contractors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_PassTypes_PassTypeId",
                schema: "public",
                table: "Passes",
                column: "PassTypeId",
                principalSchema: "public",
                principalTable: "PassTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_Stores_StoreId",
                schema: "public",
                table: "Passes",
                column: "StoreId",
                principalSchema: "public",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PassTransactions_Contractors_ContractorId",
                schema: "public",
                table: "PassTransactions",
                column: "ContractorId",
                principalSchema: "public",
                principalTable: "Contractors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PassTransactions_PassTypes_PassTypeId",
                schema: "public",
                table: "PassTransactions",
                column: "PassTypeId",
                principalSchema: "public",
                principalTable: "PassTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PassTransactions_Passes_PassId",
                schema: "public",
                table: "PassTransactions",
                column: "PassId",
                principalSchema: "public",
                principalTable: "Passes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PassTransactions_Stores_StoreId",
                schema: "public",
                table: "PassTransactions",
                column: "StoreId",
                principalSchema: "public",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Passes_Contractors_ContractorId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropForeignKey(
                name: "FK_Passes_PassTypes_PassTypeId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropForeignKey(
                name: "FK_Passes_Stores_StoreId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropForeignKey(
                name: "FK_PassTransactions_Contractors_ContractorId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_PassTransactions_PassTypes_PassTypeId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_PassTransactions_Passes_PassId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_PassTransactions_Stores_StoreId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropIndex(
                name: "IX_PassTransactions_PassId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.DropColumn(
                name: "PassId",
                schema: "public",
                table: "PassTransactions");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                schema: "public",
                table: "PassTransactions",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_Contractors_ContractorId",
                schema: "public",
                table: "Passes",
                column: "ContractorId",
                principalSchema: "public",
                principalTable: "Contractors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_PassTypes_PassTypeId",
                schema: "public",
                table: "Passes",
                column: "PassTypeId",
                principalSchema: "public",
                principalTable: "PassTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_Stores_StoreId",
                schema: "public",
                table: "Passes",
                column: "StoreId",
                principalSchema: "public",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PassTransactions_Contractors_ContractorId",
                schema: "public",
                table: "PassTransactions",
                column: "ContractorId",
                principalSchema: "public",
                principalTable: "Contractors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PassTransactions_PassTypes_PassTypeId",
                schema: "public",
                table: "PassTransactions",
                column: "PassTypeId",
                principalSchema: "public",
                principalTable: "PassTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PassTransactions_Stores_StoreId",
                schema: "public",
                table: "PassTransactions",
                column: "StoreId",
                principalSchema: "public",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
