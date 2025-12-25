using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EcoTokenSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PointHistories",
                keyColumn: "Id",
                keyValue: new Guid("b877f78e-10c2-4934-91b0-14df2e884878"));

            migrationBuilder.UpdateData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("c1e9d8a7-b6f5-4e3d-2c1b-0a9f8e7d6c5b"),
                columns: new[] { "ImageUrl", "Name" },
                values: new object[] { "/imagesItem/6144411c-172b-45d0-abcb-ae714ea825a5.jpg", "Ống hút Tre" });

            migrationBuilder.UpdateData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("d7a5f4b3-2c1e-4a9d-9b8c-3f0a7e6d5b4c"),
                column: "ImageUrl",
                value: "/imagesItem/af1c1380-7edc-40cf-afd1-95b6f8b6d91e.jpg");

            migrationBuilder.UpdateData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("e2b1a8c0-4e3d-4b7f-8c9a-6f2e0d1b4c5a"),
                columns: new[] { "ImageUrl", "Name" },
                values: new object[] { "/imagesItem/4cf97def-f0ef-4a06-899d-dbffa4e2f02f.jpg", "Túi xách vải " });

            migrationBuilder.InsertData(
                table: "Items",
                columns: new[] { "Id", "ImageUrl", "Name", "RequiredPoints" },
                values: new object[,]
                {
                    { new Guid("046564c4-882e-49c7-bd74-eb38d41ef521"), "/imagesItem/76b61892-6589-4fd1-af0c-9f02311683c9.jpg", "Giá đỡ máy tính bảng bằng tre", 100 },
                    { new Guid("ebb8e449-506c-4f12-9bac-15a63edd502f"), "/imagesItem/75e0829b-fb8f-47f1-9977-d0d377aaca9d.jpg", "Set quà tặng bằng tre ", 150 },
                    { new Guid("ed322a69-55b6-47c6-909d-2ce26aaf5a11"), "/imagesItem/8e5f5ba6-8d81-4333-842d-292399c4a44c.jpg", "Hộp bút thân thiện với môi trường", 200 }
                });

            migrationBuilder.UpdateData(
                table: "ItemsHistory",
                keyColumn: "Id",
                keyValue: new Guid("c9d8e7f6-a5b4-3c2d-1e0f-9876543210ab"),
                column: "RedemptionDate",
                value: new DateTime(2025, 12, 21, 9, 59, 11, 742, DateTimeKind.Utc).AddTicks(686));

            migrationBuilder.UpdateData(
                table: "PointHistories",
                keyColumn: "Id",
                keyValue: new Guid("b1a2c3d4-e5f6-7890-abcd-ef0123456789"),
                column: "TransactionDate",
                value: new DateTime(2025, 12, 15, 9, 59, 11, 742, DateTimeKind.Utc).AddTicks(616));

            migrationBuilder.InsertData(
                table: "PointHistories",
                columns: new[] { "Id", "AdminId", "PointsChange", "PostId", "TransactionDate", "UserId" },
                values: new object[] { new Guid("ca2d49d6-7f95-4e49-a5ca-03c199ad70e7"), new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"), 900, null, new DateTime(2025, 12, 14, 8, 59, 11, 742, DateTimeKind.Utc).AddTicks(662), new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a") });

            migrationBuilder.UpdateData(
                table: "Posts",
                keyColumn: "Id",
                keyValue: new Guid("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"),
                columns: new[] { "ApprovedRejectedAt", "SubmittedAt" },
                values: new object[] { new DateTime(2025, 12, 15, 9, 59, 11, 742, DateTimeKind.Utc).AddTicks(587), new DateTime(2025, 12, 14, 9, 59, 11, 742, DateTimeKind.Utc).AddTicks(581) });

            migrationBuilder.UpdateData(
                table: "Posts",
                keyColumn: "Id",
                keyValue: new Guid("f5e4d3c2-b1a0-9876-5432-10fedcba9876"),
                column: "SubmittedAt",
                value: new DateTime(2025, 12, 19, 9, 59, 11, 742, DateTimeKind.Utc).AddTicks(593));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a"),
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 12, 24, 9, 59, 11, 742, DateTimeKind.Utc).AddTicks(516), "$2a$11$kiLYvtupDCK9GP.euIwgHuo7y6Ko66w9GAL2bRQJzoDo9/Bhm5ZwG" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"),
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 12, 24, 9, 59, 11, 742, DateTimeKind.Utc).AddTicks(513), "$2a$11$U7Uui5d.WbC1UDdblLBNquo5Q3y9EXd81VUkYwXMoqU3fpViUFMs2" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("046564c4-882e-49c7-bd74-eb38d41ef521"));

            migrationBuilder.DeleteData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("ebb8e449-506c-4f12-9bac-15a63edd502f"));

            migrationBuilder.DeleteData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("ed322a69-55b6-47c6-909d-2ce26aaf5a11"));

            migrationBuilder.DeleteData(
                table: "PointHistories",
                keyColumn: "Id",
                keyValue: new Guid("ca2d49d6-7f95-4e49-a5ca-03c199ad70e7"));

            migrationBuilder.UpdateData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("c1e9d8a7-b6f5-4e3d-2c1b-0a9f8e7d6c5b"),
                columns: new[] { "ImageUrl", "Name" },
                values: new object[] { "/images/rewards/bamboo_straws.png", "Ống hút Inox/Tre" });

            migrationBuilder.UpdateData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("d7a5f4b3-2c1e-4a9d-9b8c-3f0a7e6d5b4c"),
                column: "ImageUrl",
                value: "/images/rewards/reusablebottle.png");

            migrationBuilder.UpdateData(
                table: "Items",
                keyColumn: "Id",
                keyValue: new Guid("e2b1a8c0-4e3d-4b7f-8c9a-6f2e0d1b4c5a"),
                columns: new[] { "ImageUrl", "Name" },
                values: new object[] { "/images/rewards/voucher50k.png", "Voucher Cây Xanh 50k" });

            migrationBuilder.UpdateData(
                table: "ItemsHistory",
                keyColumn: "Id",
                keyValue: new Guid("c9d8e7f6-a5b4-3c2d-1e0f-9876543210ab"),
                column: "RedemptionDate",
                value: new DateTime(2025, 11, 20, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6506));

            migrationBuilder.UpdateData(
                table: "PointHistories",
                keyColumn: "Id",
                keyValue: new Guid("b1a2c3d4-e5f6-7890-abcd-ef0123456789"),
                column: "TransactionDate",
                value: new DateTime(2025, 11, 14, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6447));

            migrationBuilder.InsertData(
                table: "PointHistories",
                columns: new[] { "Id", "AdminId", "PointsChange", "PostId", "TransactionDate", "UserId" },
                values: new object[] { new Guid("b877f78e-10c2-4934-91b0-14df2e884878"), new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"), 900, null, new DateTime(2025, 11, 13, 5, 20, 38, 656, DateTimeKind.Utc).AddTicks(6487), new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a") });

            migrationBuilder.UpdateData(
                table: "Posts",
                keyColumn: "Id",
                keyValue: new Guid("1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"),
                columns: new[] { "ApprovedRejectedAt", "SubmittedAt" },
                values: new object[] { new DateTime(2025, 11, 14, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6419), new DateTime(2025, 11, 13, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6413) });

            migrationBuilder.UpdateData(
                table: "Posts",
                keyColumn: "Id",
                keyValue: new Guid("f5e4d3c2-b1a0-9876-5432-10fedcba9876"),
                column: "SubmittedAt",
                value: new DateTime(2025, 11, 18, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6424));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a3c72b9a-5d2e-4f8a-9a1c-4e1d8a2c9b6a"),
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 11, 23, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6356), "$2a$11$20oqzcA./Vi/73cq2lufm.mED1zhLTRSceStGySIifhHrk7WqHHZ." });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("f3e09f3d-6a2a-47c1-80f1-622abce815ca"),
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2025, 11, 23, 6, 20, 38, 656, DateTimeKind.Utc).AddTicks(6353), "$2a$11$EhuJDVclmnf9qxTKPHeFHer5/OU.1qNQY5ruQLw5H41qcxZGdgFVa" });
        }
    }
}
