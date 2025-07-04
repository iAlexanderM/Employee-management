using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagementServer.Migrations
{
    /// <inheritdoc />
    public partial class UpdateIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_RefreshTokens",
                schema: "public",
                table: "RefreshTokens");

            migrationBuilder.RenameIndex(
                name: "IX_RefreshTokens_Token",
                schema: "public",
                table: "RefreshTokens",
                newName: "idx_refresh_tokens_token");

            migrationBuilder.RenameIndex(
                name: "IX_Passes_UniquePassId",
                schema: "public",
                table: "Passes",
                newName: "idx_passes_unique_pass_id");

            migrationBuilder.RenameIndex(
                name: "IX_Passes_ContractorId",
                schema: "public",
                table: "Passes",
                newName: "idx_passes_contractor_id");

            migrationBuilder.RenameIndex(
                name: "IX_Passes_ClosedByUserId",
                schema: "public",
                table: "Passes",
                newName: "idx_passes_closed_by_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_History_EntityType_EntityId_ChangedAt",
                schema: "public",
                table: "History",
                newName: "idx_history_entity_type_id_changed_at");

            migrationBuilder.RenameIndex(
                name: "IX_ContractorStorePasses_StoreId",
                schema: "public",
                table: "ContractorStorePasses",
                newName: "idx_contractor_store_passes_store_id");

            migrationBuilder.RenameIndex(
                name: "IX_ContractorStorePasses_PassTransactionId",
                schema: "public",
                table: "ContractorStorePasses",
                newName: "idx_contractor_store_passes_pass_transaction_id");

            migrationBuilder.RenameIndex(
                name: "IX_ContractorStorePasses_ContractorId",
                schema: "public",
                table: "ContractorStorePasses",
                newName: "idx_contractor_store_passes_contractor_id");

            migrationBuilder.RenameIndex(
                name: "IX_Contractors_PassportSerialNumber",
                schema: "public",
                table: "Contractors",
                newName: "idx_contractors_passport_serial_number");

            migrationBuilder.RenameIndex(
                name: "IX_ContractorPhotos_ContractorId",
                schema: "public",
                table: "ContractorPhotos",
                newName: "idx_contractor_photos_contractor_id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_refresh_tokens",
                schema: "public",
                table: "RefreshTokens",
                column: "Token");

            migrationBuilder.CreateIndex(
                name: "idx_stores_location",
                schema: "public",
                table: "Stores",
                columns: new[] { "Building", "Floor", "Line", "StoreNumber" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_stores_location",
                schema: "public",
                table: "Stores");

            migrationBuilder.DropPrimaryKey(
                name: "pk_refresh_tokens",
                schema: "public",
                table: "RefreshTokens");

            migrationBuilder.RenameIndex(
                name: "idx_refresh_tokens_token",
                schema: "public",
                table: "RefreshTokens",
                newName: "IX_RefreshTokens_Token");

            migrationBuilder.RenameIndex(
                name: "idx_passes_unique_pass_id",
                schema: "public",
                table: "Passes",
                newName: "IX_Passes_UniquePassId");

            migrationBuilder.RenameIndex(
                name: "idx_passes_contractor_id",
                schema: "public",
                table: "Passes",
                newName: "IX_Passes_ContractorId");

            migrationBuilder.RenameIndex(
                name: "idx_passes_closed_by_user_id",
                schema: "public",
                table: "Passes",
                newName: "IX_Passes_ClosedByUserId");

            migrationBuilder.RenameIndex(
                name: "idx_history_entity_type_id_changed_at",
                schema: "public",
                table: "History",
                newName: "IX_History_EntityType_EntityId_ChangedAt");

            migrationBuilder.RenameIndex(
                name: "idx_contractor_store_passes_store_id",
                schema: "public",
                table: "ContractorStorePasses",
                newName: "IX_ContractorStorePasses_StoreId");

            migrationBuilder.RenameIndex(
                name: "idx_contractor_store_passes_pass_transaction_id",
                schema: "public",
                table: "ContractorStorePasses",
                newName: "IX_ContractorStorePasses_PassTransactionId");

            migrationBuilder.RenameIndex(
                name: "idx_contractor_store_passes_contractor_id",
                schema: "public",
                table: "ContractorStorePasses",
                newName: "IX_ContractorStorePasses_ContractorId");

            migrationBuilder.RenameIndex(
                name: "idx_contractors_passport_serial_number",
                schema: "public",
                table: "Contractors",
                newName: "IX_Contractors_PassportSerialNumber");

            migrationBuilder.RenameIndex(
                name: "idx_contractor_photos_contractor_id",
                schema: "public",
                table: "ContractorPhotos",
                newName: "IX_ContractorPhotos_ContractorId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RefreshTokens",
                schema: "public",
                table: "RefreshTokens",
                column: "Token");
        }
    }
}
