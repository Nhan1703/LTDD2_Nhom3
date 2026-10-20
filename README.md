# 📱 Đồ Án Lập Trình Di Động (LTDD) - Nhóm 3
## 🏠 Ứng Dụng IoT Smart Home & Kiểm Soát Cổng Ra Vào (Expo Go)

Ứng dụng di động giám sát các loại cảm biến IoT và điều khiển cổng ra vào thông minh trên nền tảng **React Native / Expo Go**.

---

### 🌟 1. Danh sách cảm biến & thiết bị hiện tại
Theo yêu cầu dự án, ứng dụng đã tích hợp đầy đủ 4 module:

1. **💧 Cảm biến Nước & Rò rỉ (Water Leak / Level Sensor)**:
   - Đo trạng thái ngập nước, cảnh báo rò rỉ bồn nước / trời mưa.
   - Hiển thị mức % nước theo thời gian thực và thanh tiến trình trực quan.
   - Nút test thử nghiệm tình huống ngập nước / rò rỉ ngay trên App.

2. **🔊 Cảm biến Âm thanh (Sound / Decibel Meter)**:
   - Đo cường độ tiếng ồn theo thang đo Decibel (dB).
   - Bộ lọc hiển thị equalizer trực quan theo màu (Xanh: Yên tĩnh, Vàng: Ồn ào, Đỏ: Báo động).
   - Tự động kích hoạt chuông cảnh báo khi phát hiện tiếng nổ hoặc tiếng ồn lớn.

3. **🌡️ Cảm biến Nhiệt độ & Độ ẩm (DHT11 / DHT22)**:
   - Giám sát 2 thông số độc lập: Nhiệt độ (°C) và Độ ẩm không khí (%).
   - Tự động tính toán **Chỉ số tiện nghi môi trường** (Thoải mái, Mát mẻ, Quá nhiệt).
   - Ngưỡng cảnh báo nhiệt độ cao phục vụ phòng cháy chữa cháy.

4. **🚪 Cổng ra vào thông minh (Smart Entrance Gate / Barrier)**:
   - Hiển thị trạng thái cổng (ĐÃ KHÓA AN TOÀN / ĐANG MỞ).
   - Điều khiển đóng/mở 1 chạm từ điện thoại.
   - Tính năng **Tự động đóng cổng (Auto-Close)** sau 5s, 10s, 15s, 30s hoặc 60s.
   - Ghi lại **Nhật ký ra vào (Access Logs)** chi tiết: thời gian, ngày tháng, phương thức mở (App, Quẹt thẻ RFID, Nút bấm).

---

### 🚀 2. Khả năng mở rộng thêm cảm biến ("Về sau thêm cảm biến khác")
Kiến trúc của ứng dụng được thiết kế theo dạng **Module động (Pluggable)**:
- **Thêm trực tiếp trên giao diện App**:
  - Nhấn nút **"+"** hoặc thẻ **"Thêm Cảm Biến Mới"** trên màn hình Tổng quan.
  - Chọn sẵn các preset thông dụng: **Khí Gas MQ-2**, **Ánh sáng LDR**, **Chuyển động PIR**, **Độ ẩm đất**, **Báo khói/Lửa** hoặc **Tùy chỉnh**.
  - Đặt tên, dải đo, vị trí phòng, ngưỡng cảnh báo -> Cảm biến mới sẽ tự động lưu vào bộ nhớ máy (`AsyncStorage`) và kích hoạt ngay lập tức.
- **Thêm qua mã nguồn code**:
  - Chỉ cần khai báo thêm một object trong file [src/constants/initialSensors.js](file:///d:/LTDD_nhóm%203/src/constants/initialSensors.js).

---

### 📲 3. Hướng dẫn chạy App trên Expo Go

#### Bước 1: Khởi động server Expo
Mở terminal tại thư mục dự án và chạy:
```bash
npx expo start
```
*(Hoặc `npm start`)*

#### Bước 2: Quét mã QR bằng điện thoại
- **Điện thoại Android**: Mở ứng dụng **Expo Go** (tải trên Google Play Store) -> Chọn **Scan QR Code** và quét mã QR trên màn hình máy tính.
- **Điện thoại iOS (iPhone)**: Mở camera điện thoại lên quét mã QR -> Nhấn vào thông báo để mở trong **Expo Go**.

> **Lưu ý**: Điện thoại và máy tính cần kết nối chung một mạng WiFi. Nếu khác mạng WiFi, bạn có thể chạy `npx expo start --tunnel`.

---

### ⚡ 4. Chế độ Mô Phỏng (Demo Live)
- Ứng dụng tích hợp sẵn bộ sinh số liệu thời gian thực **Simulation Service** (`isSimulating: true`).
- Số liệu nhiệt độ, độ ẩm, âm thanh và trạng thái nước sẽ dao động tự nhiên mỗi 3 giây.
- Có các nút test nhanh tình huống khẩn cấp (Test ngập nước, Test tiếng nổ, Test quá nhiệt 40°C) rất tiện lợi để báo cáo và thuyết trình bài tập lớn!

---

### 🔌 5. Kết nối phần cứng vi điều khiển (Arduino & ESP32)

Ứng dụng hỗ trợ đầy đủ 2 cách kết nối với phần cứng thực tế:

#### 🟢 Cách 1: Dùng Arduino Uno / Nano (Cắm cáp USB vào máy tính)
Nếu nhóm bạn dùng mạch **Arduino Uno** thông thường (không có WiFi):
1. **Nạp code vào Arduino**: Mở Arduino IDE và nạp file [hardware/Arduino_Uno_Sensors/Arduino_Uno_Sensors.ino](file:///d:/LTDD_nhóm%203/hardware/Arduino_Uno_Sensors/Arduino_Uno_Sensors.ino).
   - Nước: Chân A0
   - Âm thanh: Chân A1
   - DHT11: Chân Digital 2
   - Servo mở cổng: Chân Digital 9
2. **Khởi động cầu nối trên máy tính**: Chạy lệnh:
   ```bash
   node bridge/arduino-bridge.js
   ```
   *(Cầu nối sẽ đọc cổng COM của Arduino và tạo API mạng nội bộ port 5000)*
3. **Mở App Expo Go**: Vào mục **Cài đặt** -> Tắt **Chế độ Mô phỏng** -> Nhập địa chỉ IP máy tính (VD: `http://192.168.1.15:5000`) -> App sẽ đọc trực tiếp số liệu từ Arduino theo thời gian thực!

---

#### 🔵 Cách 2: Dùng ESP32 / Arduino có WiFi (Kết nối không dây trực tiếp)
Nếu nhóm bạn dùng mạch **ESP32** (tự kết nối WiFi gửi lên App không cần cắm máy tính):
1. Mở file [hardware/ESP32_IoT_Nhom3.ino](file:///d:/LTDD_nhóm%203/hardware/ESP32_IoT_Nhom3.ino).
2. Điền tên WiFi & Mật khẩu vào code và nạp vào ESP32.
3. ESP32 sẽ tự động gửi dữ liệu cảm biến và nhận lệnh đóng/mở cổng qua MQTT Broker (`broker.emqx.io`).
