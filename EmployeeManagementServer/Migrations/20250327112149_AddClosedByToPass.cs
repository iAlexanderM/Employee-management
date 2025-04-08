using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddClosedByToPass : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CloseDate",
                schema: "public",
                table: "Passes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClosedBy",
                schema: "public",
                table: "Passes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClosedByUserId",
                schema: "public",
                table: "Passes",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Passes_ClosedByUserId",
                schema: "public",
                table: "Passes",
                column: "ClosedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Passes_AspNetUsers_ClosedByUserId",
                schema: "public",
                table: "Passes",
                column: "ClosedByUserId",
                principalSchema: "public",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Passes_AspNetUsers_ClosedByUserId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropIndex(
                name: "IX_Passes_ClosedByUserId",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropColumn(
                name: "CloseDate",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropColumn(
                name: "ClosedBy",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropColumn(
                name: "ClosedByUserId",
                schema: "public",
                table: "Passes");
        }
    }
}
