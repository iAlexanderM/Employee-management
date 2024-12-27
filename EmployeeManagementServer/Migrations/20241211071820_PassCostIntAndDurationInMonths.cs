using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class PassCostIntAndDurationInMonths : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DurationInDays",
                schema: "public",
                table: "PassTypes",
                newName: "DurationInMonths");

            migrationBuilder.AlterColumn<int>(
                name: "Cost",
                schema: "public",
                table: "PassTypes",
                type: "integer",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DurationInMonths",
                schema: "public",
                table: "PassTypes",
                newName: "DurationInDays");

            migrationBuilder.AlterColumn<decimal>(
                name: "Cost",
                schema: "public",
                table: "PassTypes",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
