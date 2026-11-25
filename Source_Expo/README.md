# 3. MÃ NGUỒN ỨNG DỤNG DI ĐỘNG (EXPO REACT NATIVE) - ĐỒ ÁN LTDD NHÓM 3

## Giới thiệu
Ứng dụng di động giám sát Smart Home và kiểm soát cổng an ninh được xây dựng bằng React Native và nền tảng Expo SDK 58.

## Hướng dẫn chạy ứng dụng trên điện thoại (Expo Go)

1. Mở cửa sổ dòng lệnh tại thư mục này:
   ```bash
   cd Source_Expo
   ```
2. Cài đặt các thư viện phụ thuộc (nếu tải mới về máy):
   ```bash
   npm install
   ```
3. Khởi động máy chủ Metro Bundler:
   ```bash
   npx expo start
   ```
4. Dùng điện thoại đã cài ứng dụng **Expo Go** (Android / iOS) quét mã QR hiển thị trên màn hình để mở ứng dụng.

## Các màn hình chính
- **Tổng quan (DashboardScreen)**: Giám sát môi trường phòng khách DHT11 và công tắc thông minh điều khiển cổng và đèn.
- **Cổng vào (GateScreen)**: Lịch sử quẹt thẻ RFID, quản lý thẻ Master và chế độ tự động đóng cổng.
- **Thống kê (HistoryScreen)**: Biểu đồ trực quan diễn biến nhiệt độ và độ ẩm không khí.
- **Cảnh báo (AlertsScreen)**: Danh sách cảnh báo an ninh, ngập nước, tiếng ồn và nhiệt độ cao.
- **Cài đặt (SettingsScreen)**: Cấu hình địa chỉ IP LAN, kết nối Firebase Cloud và tài liệu API Swagger UI.
