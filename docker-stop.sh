#!/bin/bash

# ============================================
# SCRIPT DỪNG DOCKER - CHO NGƯỜI MỚI HỌC
# ============================================

echo "🛑 Đang dừng Docker containers..."
echo ""

docker-compose down

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Đã dừng containers thành công!"
    echo ""
    echo "💡 Để xóa cả data (volumes), chạy:"
    echo "   docker-compose down -v"
else
    echo ""
    echo "❌ Có lỗi xảy ra!"
fi

