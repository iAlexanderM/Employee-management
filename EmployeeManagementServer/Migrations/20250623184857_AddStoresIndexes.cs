using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class AddStoresIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_Passes_StoreId",
                schema: "public",
                table: "Passes",
                newName: "idx_passes_store_id");

            migrationBuilder.CreateIndex(
                name: "idx_stores_building",
                schema: "public",
                table: "Stores",
                column: "Building");

            migrationBuilder.CreateIndex(
                name: "idx_stores_floor",
                schema: "public",
                table: "Stores",
                column: "Floor");

            migrationBuilder.CreateIndex(
                name: "idx_stores_is_archived",
                schema: "public",
                table: "Stores",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "idx_stores_line",
                schema: "public",
                table: "Stores",
                column: "Line");

            migrationBuilder.CreateIndex(
                name: "idx_stores_store_number",
                schema: "public",
                table: "Stores",
                column: "StoreNumber");

            migrationBuilder.CreateIndex(
                name: "idx_pass_types_name",
                schema: "public",
                table: "PassTypes",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "idx_passes_end_date",
                schema: "public",
                table: "Passes",
                column: "EndDate");

            migrationBuilder.CreateIndex(
                name: "idx_passes_is_closed",
                schema: "public",
                table: "Passes",
                column: "IsClosed");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_stores_building",
                schema: "public",
                table: "Stores");

            migrationBuilder.DropIndex(
                name: "idx_stores_floor",
                schema: "public",
                table: "Stores");

            migrationBuilder.DropIndex(
                name: "idx_stores_is_archived",
                schema: "public",
                table: "Stores");

            migrationBuilder.DropIndex(
                name: "idx_stores_line",
                schema: "public",
                table: "Stores");

            migrationBuilder.DropIndex(
                name: "idx_stores_store_number",
                schema: "public",
                table: "Stores");

            migrationBuilder.DropIndex(
                name: "idx_pass_types_name",
                schema: "public",
                table: "PassTypes");

            migrationBuilder.DropIndex(
                name: "idx_passes_end_date",
                schema: "public",
                table: "Passes");

            migrationBuilder.DropIndex(
                name: "idx_passes_is_closed",
                schema: "public",
                table: "Passes");

            migrationBuilder.RenameIndex(
                name: "idx_passes_store_id",
                schema: "public",
                table: "Passes",
                newName: "IX_Passes_StoreId");
        }
    }
}
