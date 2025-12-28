#!/bin/bash

# ============================================
# SCRIPT KHỞI ĐỘNG DOCKER - CHO NGƯỜI MỚI HỌC
# ============================================
# File này giúp bạn chạy Docker dễ dàng hơn
# Chỉ cần chạy: ./docker-start.sh

echo "🐳 Đang khởi động Docker containers..."
echo ""

# Kiểm tra Docker đã cài chưa
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt!"
    echo "Vui lòng cài Docker Desktop từ: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Kiểm tra Docker đang chạy chưa
if ! docker info &> /dev/null; then
    echo "❌ Docker chưa chạy!"
    echo "Vui lòng mở Docker Desktop và đợi đến khi 'Docker is running'"
    exit 1
fi

echo "✅ Docker đã sẵn sàng"
echo ""

# Build và chạy containers
echo "📦 Đang build và khởi động containers..."
echo "⏳ Lần đầu sẽ mất 5-10 phút (tải images)..."
echo ""

docker-compose up -d --build

# Kiểm tra kết quả
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Containers đã khởi động thành công!"
    echo ""
    echo "📊 Trạng thái containers:"
    docker-compose ps
    echo ""
    echo "🌐 Truy cập ứng dụng:"
    echo "   - Swagger UI: http://localhost:5109"
    echo "   - API Base: http://localhost:5109/api"
    echo ""
    echo "📝 Xem logs:"
    echo "   docker-compose logs -f backend"
    echo ""
    echo "🛑 Dừng containers:"
    echo "   docker-compose down"
    echo ""
else
    echo ""
    echo "❌ Có lỗi xảy ra!"
    echo "Xem logs để biết thêm chi tiết:"
    echo "   docker-compose logs"
    exit 1
fi

