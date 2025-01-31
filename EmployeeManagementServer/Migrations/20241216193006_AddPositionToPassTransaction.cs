﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddPositionToPassTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Position",
                schema: "public",
                table: "PassTransactions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Position",
                schema: "public",
                table: "PassTransactions");
        }
    }
}
