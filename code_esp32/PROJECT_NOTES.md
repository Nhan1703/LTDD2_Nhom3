# Project Notes: Đồ Án LTDD - Hệ Thống Smart Home Toàn Diện

## 1. Danh sách thiết bị ngoại vi & Chân kết nối ESP32

| Thiết bị | Chân trên thiết bị | Chân ESP32 | Chức năng |
|---|---|---|---|
| **Đầu thu hồng ngoại (3 chân)** | Chân 1 (Trái - OUT) | **GPIO 15** | Nhận tín hiệu Remote hồng ngoại (0ms) |
| | Chân 2 (Giữa - GND) | **GND** | Mass |
| | Chân 3 (Phải - VCC) | **3V3** | Nguồn 3.3V |
| **RFID RC522** | SDA (SS) | **GPIO 5** | SPI CS |
| | SCK | **GPIO 18** | SPI Clock |
| | MOSI | **GPIO 23** | SPI MOSI |
| | MISO | **GPIO 19** | SPI MISO |
| | RST | **GPIO 26** | Reset |
| | 3.3V & GND | **3V3 & GND** | Nguồn |
| **Servo SG90** | Tín hiệu (Cam/Vàng) | **GPIO 13** | Đóng / mở cổng |
| **Cảm biến DHT11** | Chân Data | **GPIO 4** | Nhiệt độ & Độ ẩm |
| **LCD 16x2 I2C** | SDA | **GPIO 21** | I2C Data (tốc độ 50kHz chống sụt áp) |
| | SCL | **GPIO 22** | I2C Clock |
| | VCC & GND | **VIN (5V) & GND**| Nguồn LCD |
| **Còi Buzzer** | Cực dương (+) | **GPIO 27** | Còi báo động |
| **Đèn LED** | Cực dương (+) | **GPIO 2** | LED xanh onboard |

## 2. Tính năng hệ thống
- **Remote hồng ngoại:** Bấm 1 lần mở cửa, bấm lần 2 khóa cửa (0ms tức thì).
- **RFID RC522:** Kích sóng cực đại 48dB chống chập chờn, tự động chẩn đoán SPI.
- **Màn hình LCD:** Hiện thông báo mở/đóng cửa 2 giây rồi tự quay về hiển thị nhiệt độ & độ ẩm.
- **Kiến trúc Dual-Core:** Core 0 chạy ngầm mạng Internet, Core 1 chạy toàn bộ phần cứng.
