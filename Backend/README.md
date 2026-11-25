# 2. BACKEND & CLOUD API - ĐỒ ÁN LTDD NHÓM 3

## Giới thiệu
Thư mục chứa mã nguồn Backend Vercel Serverless và toàn bộ hệ thống tài liệu chuẩn **OpenAPI 3.0 / Swagger UI**.

## Đường dẫn truy cập trực tuyến
- **Trang chủ Backend & Swagger UI**: [https://ltdd2nhom3.vercel.app/swagger.html](https://ltdd2nhom3.vercel.app/swagger.html)
- **Đặc tả chuẩn OpenAPI 3.0 (JSON)**: [https://ltdd2nhom3.vercel.app/openapi.json](https://ltdd2nhom3.vercel.app/openapi.json)

## Danh sách API Endpoints
1. `GET /api/sensors`: Đọc dữ liệu cảm biến thời gian thực.
2. `POST /api/gate`: Điều khiển đóng mở cổng ra vào (`{"open": true/false}`).
3. `POST /api/light`: Điều khiển bật tắt đèn LED D2 (`{"light": true/false}`).
4. `GET /api/telemetry`: Lấy dữ liệu telemetry từ Firebase Cloud.
