using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddCreateAtAndSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "public",
                table: "Stores",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "public",
                table: "Stores",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "public",
                table: "StoreNumbers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "public",
                table: "StoreNumbers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "public",
                table: "Lines",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "public",
                table: "Lines",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "public",
                table: "Floors",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "public",
                table: "Floors",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "public",
                table: "Contractors",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "public",
                table: "Contractors",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "public",
                table: "Buildings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "public",
                table: "Buildings",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "public",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "public",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "public",
                table: "StoreNumbers");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "public",
                table: "StoreNumbers");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "public",
                table: "Lines");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "public",
                table: "Lines");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "public",
                table: "Floors");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "public",
                table: "Floors");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "public",
                table: "Contractors");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "public",
                table: "Contractors");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "public",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "public",
                table: "Buildings");
        }
    }
}
