# 1. MÃ NGUỒN ARDUINO (ESP32) - ĐỒ ÁN LTDD NHÓM 3

## Giới thiệu
Thư mục chứa toàn bộ mã nguồn C/C++ điều khiển bo mạch vi điều khiển ESP32 cho hệ thống Smart Home và Kiểm soát cổng ra vào.

## Sơ đồ kết nối chân phần cứng (Wiring Pinout)
- **Đầu đọc thẻ RFID RC522**:
  - SDA (SS): GPIO 5
  - SCK: GPIO 18
  - MOSI: GPIO 23
  - MISO: GPIO 19
  - RST: GPIO 26
  - 3.3V & GND
- **Động cơ Servo SG90 (Mở/khóa cổng)**: GPIO 13
- **Còi báo động (Buzzer)**: GPIO 27
- **Cảm biến nhiệt độ - độ ẩm DHT11**: GPIO 4
- **Màn hình LCD 16x2 I2C**:
  - SDA: GPIO 21
  - SCL: GPIO 22
- **Đèn LED chiếu sáng D2**: GPIO 2 (Onboard LED)
- **Mắt thu hồng ngoại Remote IR**: GPIO 15
- **Nút nhấn BOOT (Reset Master)**: GPIO 0

## Kiến trúc đa nhân (Dual-Core FreeRTOS)
- **Nhân 1 (Core 1)**: Xử lý ngoại vi, điều khiển động cơ Servo, còi, màn hình LCD, cảm biến DHT11 và Web Server nội bộ mạng LAN cổng 80 với độ trễ 0ms.
- **Nhân 0 (Core 0)**: Chạy ngầm tác vụ kết nối mạng Wi-Fi và đồng bộ dữ liệu thời gian thực với Cloud Firebase qua giao thức HTTPS bảo mật (Stack 16KB).
