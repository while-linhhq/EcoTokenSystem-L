using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EcoTokenSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FullDatabaseSetupV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("c1e9d8a7-b6f5-4e3d-2c1b-0a9f8e7d6c5b"),
                columns: new[] { "ImageUrl", "Name", "RequiredPoints" },
                values: new object[] { "/images/rewards/bamboo_straws.png", "Ống hút Inox/Tre", 400 });

            migrationBuilder.InsertData(
                table: "ItemsHistory",
                columns: new[] { "Id", "ItemId", "RedemptionDate", "UserId" },
                values: new object[] { new Guid("c9d8e7f6-a5b4-3c2d-1e0f-9876543210ab"), new Guid("c1e9d8a7-b6f5-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(2025, 11, 20, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6506), new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a") });

            migrationBuilder.InsertData(
                table: "PointHistories",
                columns: new[] { "Id", "AdminId", "PointsChange", "PostId", "TransactionDate", "UserId" },
                values: new object[] { new Guid("b877f78e-10c2-4934-91b0-14df2e884878"), new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"), 900, null, new DateTime(2025, 11, 13, 5, 20, 38, 656, DateTimeKind.Utc).AddTicks(6487), new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a") });

            migrationBuilder.InsertData(
                table: "Posts",
                columns: new[] { "Id", "AdminId", "ApprovedRejectedAt", "AwardedPoints", "Content", "ImageUrl", "RejectionReason", "StatusId", "SubmittedAt", "Title", "UserId" },
                values: new object[,]
                {
                    { new Guid("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"), new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"), new DateTime(2025, 11, 14, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6419), 600, "Đây là bài viết mẫu đã được duyệt.", "/images/seed/post1.jpg", null, 2, new DateTime(2025, 11, 13, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6413), "Cách phân loại rác hiệu quả", new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a") },
                    { new Guid("f5e4d3c2-b1a0-9876-5432-10fedcba9876"), null, null, 0, "Bài viết mẫu đang chờ duyệt  .", "/images/seed/post2.jpg", null, 1, new DateTime(2025, 11, 18, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6424), "Tại sao cần dùng túi tái chế?  ", new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a") }
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a"),
                columns: new[] { "Address", "CreatedAt", "DateOfBirth", "Gender", "Name", "PasswordHash" },
                values: new object[] { "", new DateTime(2025, 11, 23, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6356), null, "", "Nhật Anh", "$2a$11$20oqzcA./Vi/73cq2lufm.mED1zhLTRSceStGySIifhHrk7WqHHZ." });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"),
                columns: new[] { "Address", "CreatedAt", "DateOfBirth", "Gender", "PasswordHash" },
                values: new object[] { "", new DateTime(2025, 11, 23, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6353), null, "", "$2a$11$EhuJDVclmnf9qxTKPHeFHer5/OU.1qNQY5ruQLw5H41qcxZGdgFVa" });

            migrationBuilder.InsertData(
                table: "PointHistories",
                columns: new[] { "Id", "AdminId", "PointsChange", "PostId", "TransactionDate", "UserId" },
                values: new object[] { new Guid("b1a2c3d4-e5f6-7890-abcd-ef0123456789"), new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"), 600, new Guid("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"), new DateTime(2025, 11, 14, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6447), new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a") });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ItemsHistory",
                keyColumn: "Id",
                keyValue: new Guid("c9d8e7f6-a5b4-3c2d-1e0f-9876543210ab"));

            migrationBuilder.DeleteData(
                table: "PointHistories",
                keyColumn: "Id",
                keyValue: new Guid("b1a2c3d4-e5f6-7890-abcd-ef0123456789"));

            migrationBuilder.DeleteData(
                table: "PointHistories",
                keyColumn: "Id",
                keyValue: new Guid("b877f78e-10c2-4934-91b0-14df2e884878"));

            migrationBuilder.DeleteData(
                table: "Posts",
                keyColumn: "Id",
                keyValue: new Guid("f5e4d3c2-b1a0-9876-5432-10fedcba9876"));

            migrationBuilder.DeleteData(
                table: "Posts",
                keyColumn: "Id",
                keyValue: new Guid("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"));

            migrationBuilder.UpdateData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("c1e9d8a7-b6f5-4e3d-2c1b-0a9f8e7d6c5b"),
                columns: new[] { "ImageUrl", "Name", "RequiredPoints" },
                values: new object[] { "/images/rewards/premium.png", "1 Tháng Membership Premium", 2500 });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a"),
                columns: new[] { "Address", "CreatedAt", "DateOfBirth", "Gender", "Name", "PasswordHash" },
                values: new object[] { "TP Hồ Chí Minh", new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc).AddTicks(2265), new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc).AddTicks(2264), "Nam", "Người dùng thử nghiệm", "$2a$11$YxK8vhj1T.F70B.HtsDBIOeFRDz4ONqiJ8uc8Rc32Xwy3Gy3wuCA6" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"),
                columns: new[] { "Address", "CreatedAt", "DateOfBirth", "Gender", "PasswordHash" },
                values: new object[] { "TP Hồ Chí Minh", new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc).AddTicks(2209), new DateTime(2025, 11, 21, 6, 58, 59, 677, DateTimeKind.Utc).AddTicks(2201), "Nữ", "$2a$11$QOh34GWE1pvJ1QzCEht4leqFoWINZcdFdZWpc9B5PPlmg.oTX3OwO" });
        }
    }
}
