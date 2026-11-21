#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <Preferences.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

/*
  ======================================================================
  ĐỒ ÁN LẬP TRÌNH DI ĐỘNG (LTDD) - NHÓM 3
  HỆ THỐNG IOT SMART HOME & KIỂM SOÁT CỔNG RA VÀO (ESP32)
  KIẾN TRÚC MỚI TINH GỌN (BỎ HOÀN TOÀN MQTT BROKER):
  1. Nền tảng Web Vercel & Mobile App Expo Go
  2. Firebase Realtime Database (Project: ltdd-945a5 - Máy chủ Singapore)
  3. Web Server nội bộ (Port 80) - Kết nối trực tiếp App qua mạng Wi-Fi LAN
  ======================================================================
*/

// ==================================================
// 1. KHAI BÁO CHÂN KẾT NỐI PHẦN CỨNG
// ==================================================

// Chân giao tiếp SPI cho mô-đun đọc thẻ RFID RC522
#define SS_PIN    5   // Chân SDA / SS của RC522
#define RST_PIN   26  // Chân Reset của RC522
#define SCK_PIN   18  // Chân xung nhịp SCK SPI
#define MOSI_PIN  23  // Chân dữ liệu MOSI SPI
#define MISO_PIN  19  // Chân dữ liệu MISO SPI

// Chân điều khiển Servo SG90 đóng/mở cổng (PWM)
#define SERVO_PIN 13

// Chân điều khiển còi báo động Buzzer
#define BUZZER_PIN 27

// Chân kết nối cảm biến nhiệt độ & độ ẩm DHT11
#define DHT_PIN 4
#define DHT_TYPE DHT11

// Chân giao tiếp I2C cho màn hình LCD 16x2
#define LCD_SDA 21
#define LCD_SCL 22

// Chân đèn LED chiếu sáng / đèn báo (GPIO 2 có sẵn trên board ESP32)
#define LED_PIN 2

// Cấu hình còi: 0 = Còi thụ động (Passive buzzer dùng tone), 1 = Còi chủ động (Active buzzer dùng HIGH/LOW)
#define ACTIVE_BUZZER 0

// ==================================================
// 2. CẤU HÌNH KẾT NỐI MẠNG WI-FI & FIREBASE REALTIME DB
// ==================================================

// Thông tin mạng Wi-Fi phát từ điện thoại / Router
const char* ssid = "Danh Ngoc";               // Tên mạng Wi-Fi
const char* password = "0982555644";          // Mật khẩu Wi-Fi

// Địa chỉ Firebase Realtime Database của dự án LTDD2 Nhóm 3
const char* firebaseUrl = "https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app";

// ==================================================
// 3. KHỞI TẠO CÁC ĐỐI TƯỢNG NGOẠI VI
// ==================================================

// Đối tượng đọc thẻ RFID RC522
MFRC522 rfid(SS_PIN, RST_PIN);

// Đối tượng điều khiển động cơ Servo
Servo servoCua;

// Đối tượng lưu trữ cấu hình vào bộ nhớ Flash không bay màu (NVS)
Preferences boNho;

// Đối tượng điều khiển màn hình LCD 16x2 qua địa chỉ I2C 0x27
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Đối tượng cảm biến nhiệt độ & độ ẩm DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Máy chủ Web Server nội bộ chạy cổng 80 tiếp nhận lệnh từ App qua mạng Wi-Fi LAN
WebServer server(80);

// ==================================================
// 4. BIẾN TRẠNG THÁI HỆ THỐNG
// ==================================================

// Mã UID của thẻ Master dùng để phân quyền
String uidTheMaster = "";

// Mã UID của thẻ vừa quẹt gần nhất
String uidTheVuaQuet = "";

// Giá trị nhiệt độ và độ ẩm đọc từ cảm biến
float nhietDo = 0.0;
float doAm = 0.0;

// Trạng thái hoạt động của cơ cấu chấp hành
bool trangThaiCua = false;  // false: Cổng đang đóng khóa, true: Cổng đang mở
bool trangThaiDen = false;  // false: Đèn tắt, true: Đèn bật

// Các biến lưu mốc thời gian phục vụ cơ chế đa nhiệm Non-blocking (dùng millis)
unsigned long thoiGianDocDHT = 0;
unsigned long thoiGianLCD = 0;
unsigned long thoiGianGuiCloud = 0;
unsigned long thoiGianKiemTraLenhFirebase = 0;
unsigned long thoiGianMoCuaTuDong = 0;
bool dangDemThoiGianDongCua = false;

// Góc mở và thời gian tự động đóng cửa
const int GOC_DONG_CUA = 0;                  // Góc 0 độ: Cửa đóng khóa
const int GOC_MO_CUA = 90;                   // Góc 90 độ: Cửa mở
const unsigned long THOI_GIAN_MO_CUA = 4000; // Giữ cửa mở trong 4 giây rồi tự động đóng

// ==================================================
// KHAI BÁO NGUYÊN MẪU HÀM TRƯỚC (FORWARD DECLARATION)
// Giúp trình biên dịch nhận diện hàm đồng bộ Cloud trước khi gọi
// ==================================================
void guiDuLieuCloud();
void guiLenFirebase();

// ==================================================
// 5. ĐIỀU KHIỂN CÒI BÁO ĐỘNG BUZZER
// ==================================================

// Phát âm thanh còi theo tần số (Hz) và thời lượng (ms)
void phatCoi(int tanSo, int thoiGian) {
  #if ACTIVE_BUZZER
    digitalWrite(BUZZER_PIN, HIGH);
    delay(thoiGian);
    digitalWrite(BUZZER_PIN, LOW);
  #else
    tone(BUZZER_PIN, tanSo);
    delay(thoiGian);
    noTone(BUZZER_PIN);
  #endif
}

// Âm thanh khi quẹt thẻ hợp lệ / mở cửa thành công
void coiThanhCong() {
  phatCoi(1500, 150);
  delay(80);
  phatCoi(2000, 150);
}

// Âm thanh khi quẹt thẻ không hợp lệ hoặc bị từ chối
void coiThatBai() {
  phatCoi(500, 500);
}

// Âm thanh khi đăng ký thành công thẻ Master mới
void coiDangKy() {
  phatCoi(1000, 100);
  delay(100);
  phatCoi(1500, 100);
  delay(100);
  phatCoi(2000, 200);
}

// ==================================================
// 6. HIỂN THỊ MÀN HÌNH LCD 16X2
// ==================================================

// In nội dung lên 2 dòng của màn hình LCD
void hienThi(String dong1, String dong2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(dong1);
  lcd.setCursor(0, 1);
  lcd.print(dong2);
}

// Màn hình chờ quẹt thẻ mặc định
void hienThiChoThe() {
  hienThi("KHOA CUA THONG", "QUET THE RFID");
}

// ==================================================
// 7. XỬ LÝ THẺ THÔNG MINH RFID RC522
// ==================================================

// Đọc mã UID từ thẻ RFID và chuyển đổi thành chuỗi Hex viết hoa
String docUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      uid += "0";
    }
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

// Lưu UID thẻ Master vào bộ nhớ Flash NVS của ESP32
void luuTheMaster(String uid) {
  boNho.begin("SmartLock", false);
  boNho.putString("masterUID", uid);
  boNho.end();

  uidTheMaster = uid;
  Serial.println("[HE THONG] Da luu the Master thanh cong!");
  Serial.print("[HE THONG] UID Master: ");
  Serial.println(uidTheMaster);
}

// Tải UID thẻ Master đã lưu trong bộ nhớ Flash khi khởi động máy
void docTheMaster() {
  boNho.begin("SmartLock", true);
  uidTheMaster = boNho.getString("masterUID", "");
  boNho.end();

  if (uidTheMaster.length() == 0) {
    Serial.println("[HE THONG] Chua co the Master trong bo nho!");
  } else {
    Serial.println("[HE THONG] Da tai the Master tu bo nho:");
    Serial.print("[HE THONG] UID Master: ");
    Serial.println(uidTheMaster);
  }
}

// Đăng ký thẻ Master lần đầu tiên
void dangKyTheMaster(String uid) {
  luuTheMaster(uid);
  hienThi("DANG KY THANH", "CONG THE MASTER");
  Serial.println("[RFID] Dang ky the Master thanh cong!");
  coiDangKy();
  delay(1500);
  hienThiChoThe();
  guiDuLieuCloud(); // Đồng bộ trạng thái thẻ lên Firebase
}

// ==================================================
// 8. ĐIỀU KHIỂN CỔNG RA VÀO & ĐÈN CHIẾU SÁNG
// ==================================================

// Hàm mở cửa bằng động cơ Servo
void moCua(String nguonMo = "RFID") {
  trangThaiCua = true;
  servoCua.write(GOC_MO_CUA);
  Serial.print("[CUA] Mo cua! Nguon: ");
  Serial.println(nguonMo);

  hienThi("THE HOP LE", "DANG MO CUA");
  coiThanhCong();

  thoiGianMoCuaTuDong = millis();
  dangDemThoiGianDongCua = true;

  // Gửi thông báo ngay lập tức lên Firebase Cloud
  guiDuLieuCloud();
}

// Hàm đóng và khóa cửa bằng động cơ Servo
void dongCua() {
  trangThaiCua = false;
  servoCua.write(GOC_DONG_CUA);
  dangDemThoiGianDongCua = false;
  Serial.println("[CUA] Da dong va khoa an toan!");

  hienThi("CUA DA DONG", "QUET THE RFID");
  phatCoi(1000, 200);

  // Cập nhật trạng thái đóng cửa lên Firebase
  guiDuLieuCloud();
  delay(800);
  hienThiChoThe();
}

// Điều khiển bật hoặc tắt đèn LED trên GPIO 2
void datTrangThaiDen(bool batDen, String nguon = "APP") {
  trangThaiDen = batDen;
  digitalWrite(LED_PIN, trangThaiDen ? HIGH : LOW);
  Serial.print("[DEN] Trang thai: ");
  Serial.print(trangThaiDen ? "BAT" : "TAT");
  Serial.print(" | Nguon: ");
  Serial.println(nguon);

  guiDuLieuCloud();
}

// Báo lỗi từ chối mở cửa khi quét thẻ lạ
void tuChoiThe() {
  Serial.println("[RFID] The khong hop le!");
  hienThi("THE KHONG HOP", "TU CHOI MO CUA");
  coiThatBai();
  delay(1500);
  hienThiChoThe();
  guiDuLieuCloud();
}

// Kiểm tra và xác thực thẻ RFID khi có người quẹt thẻ
void kiemTraRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uidHienTai = docUID();
  uidTheVuaQuet = uidHienTai;

  Serial.println("\n================================");
  Serial.println("[RFID] PHAT HIEN THE MOI");
  Serial.print("[RFID] UID The vua quet: ");
  Serial.println(uidHienTai);
  Serial.print("[RFID] UID The Master: ");
  Serial.println(uidTheMaster);
  Serial.println("================================");

  // Xử lý các trường hợp nhận diện thẻ:
  // 1. Thẻ đầu tiên nếu chưa có Master -> Đăng ký làm Master
  // 2. Thẻ khớp UID Master, thẻ thực tế 620F0307 hoặc 239A6C06 -> Cho phép mở cửa
  if (uidTheMaster.length() == 0) {
    Serial.println("[HE THONG] Luu the dau tien lam Master!");
    dangKyTheMaster(uidHienTai);
  } else if (uidHienTai.equals(uidTheMaster) || uidHienTai.equals("620F0307") || uidHienTai.equals("239A6C06")) {
    Serial.println("[RFID] XAC THUC HOP LE THANH CONG!");
    moCua("The RFID hop le");
  } else {
    Serial.println("[RFID] THE LA KHONG DUNG!");
    tuChoiThe();
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ==================================================
// 9. ĐỌC CẢM BIẾN NHIỆT ĐỘ & ĐỘ ẨM DHT11
// ==================================================

// Đọc định kỳ giá trị nhiệt độ và độ ẩm mỗi 2 giây
void docCamBienDHT() {
  if (millis() - thoiGianDocDHT < 2000) return;
  thoiGianDocDHT = millis();

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Kiểm tra tính hợp lệ của dữ liệu đọc về
  if (!isnan(h) && !isnan(t)) {
    doAm = h;
    nhietDo = t;
  }
}

// Hiển thị nhiệt độ và độ ẩm lên màn hình LCD 16x2
void capNhatLCD() {
  if (dangDemThoiGianDongCua) return; // Đang trong quá trình mở cửa thì giữ thông báo mở cửa
  if (millis() - thoiGianLCD < 3000) return;
  thoiGianLCD = millis();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("NHIET DO: ");
  lcd.print(nhietDo, 1);
  lcd.print((char)223); // Ký tự độ C
  lcd.print("C");

  lcd.setCursor(0, 1);
  lcd.print("DO AM:    ");
  lcd.print(doAm, 0);
  lcd.print("%");
}

// ==================================================
// 10. ĐÓNG GÓI CHUỖI JSON ĐỒNG BỘ DỮ LIỆU
// ==================================================

// Tạo chuỗi định dạng JSON chuẩn chứa toàn bộ thông số nhà thông minh
String taoChuoiJson() {
  String json = "{";
  json += "\"temp\":" + String(nhietDo, 1) + ",";
  json += "\"hum\":" + String(doAm, 0) + ",";
  json += "\"dht_ok\":" + String((nhietDo > 0) ? "true" : "false") + ",";
  json += "\"gate\":" + String(trangThaiCua ? "true" : "false") + ",";
  json += "\"light\":" + String(trangThaiDen ? "true" : "false") + ",";
  json += "\"rfid\":\"" + uidTheVuaQuet + "\",";
  json += "\"master\":\"" + uidTheMaster + "\",";
  json += "\"updatedAt\":" + String(millis());
  json += "}";
  return json;
}

// ==================================================
// 11. ĐỒNG BỘ DỮ LIỆU LÊN FIREBASE REALTIME DATABASE
// ==================================================

// Gửi toàn bộ telemetry lên Firebase qua REST API HTTPS PUT
void guiLenFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Bỏ qua kiểm tra chứng chỉ SSL để kết nối nhanh chóng
  client.setTimeout(3); // Giới hạn timeout 3 giây tránh treo chương trình

  HTTPClient http;
  String url = String(firebaseUrl) + "/smart_home/telemetry.json";

  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  String payload = taoChuoiJson();
  int httpResponseCode = http.PUT(payload);

  if (httpResponseCode == 200) {
    Serial.println("[FIREBASE] Ghi thanh cong len Cloud!");
  } else {
    Serial.print("[FIREBASE] Loi phan hoi HTTP (Code: ");
    Serial.print(httpResponseCode);
    Serial.print("): ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  http.end();
  client.stop();
}

// Hàm đồng bộ dữ liệu Cloud (gọi trực tiếp Firebase)
void guiDuLieuCloud() {
  guiLenFirebase();
}

// Xóa lệnh cổng vừa xử lý trên Firebase để tránh lặp mở đóng cửa vô tận
void xoaLenhCongFirebase() {
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(2);
  HTTPClient http;
  String url = String(firebaseUrl) + "/smart_home/commands.json";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.PATCH("{\"gate\":null}");
  http.end();
  client.stop();
}

// Kiểm tra lệnh điều khiển từ App thông qua Firebase (/smart_home/commands.json) với phản hồi siêu tốc (< 250ms)
void kiemTraLenhFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (millis() - thoiGianKiemTraLenhFirebase < 250) return; // Quét lệnh phản hồi tức thì mỗi 250ms thay vì 800ms
  thoiGianKiemTraLenhFirebase = millis();

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(1); // Giảm timeout xuống 1 giây để không chặn vòng lặp

  HTTPClient http;
  http.setReuse(true); // Tái sử dụng socket HTTP giảm độ trễ bắt tay SSL
  String url = String(firebaseUrl) + "/smart_home/commands.json";

  http.begin(client, url);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();

    // Kiểm tra lệnh mở hoặc đóng cửa từ Firebase
    if (payload.indexOf("\"gate\":true") >= 0 && !trangThaiCua) {
      moCua("Firebase App");
      xoaLenhCongFirebase(); // Tiêu thụ lệnh ngay lập tức, ngăn lặp vô tận
    } else if (payload.indexOf("\"gate\":false") >= 0 && trangThaiCua) {
      dongCua();
      xoaLenhCongFirebase(); // Tiêu thụ lệnh ngay lập tức
    }

    // Kiểm tra lệnh bật hoặc tắt đèn từ Firebase
    if (payload.indexOf("\"light\":true") >= 0 && !trangThaiDen) {
      datTrangThaiDen(true, "Firebase App");
    } else if (payload.indexOf("\"light\":false") >= 0 && trangThaiDen) {
      datTrangThaiDen(false, "Firebase App");
    }
  }
  http.end();
  client.stop();
}

// ==================================================
// 12. XỬ LÝ CÁC ĐƯỜNG DẪN WEB SERVER NỘI BỘ (HTTP PORT 80)
// ==================================================

// Cấu hình tiêu đề CORS cho phép ứng dụng web trên trình duyệt truy cập
void thietLapCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Origin, Accept");
}

// Xử lý tiền kiểm tra OPTIONS của trình duyệt
void xuLyOptions() {
  thietLapCORS();
  server.send(204);
}

// GET /api/sensors - Lấy toàn bộ thông số cảm biến qua mạng LAN
void xuLyLayCamBien() {
  thietLapCORS();
  String json = taoChuoiJson();
  server.send(200, "application/json", json);
}

// POST /api/gate - Điều khiển đóng mở cổng tức thì qua mạng LAN
void xuLyDieuKhienCua() {
  thietLapCORS();
  String body = server.arg("plain");
  Serial.print("[HTTP API] Yeu cau dieu khien cong: ");
  Serial.println(body);

  if (body.indexOf("\"open\":true") >= 0 || body.indexOf("\"action\":\"OPEN\"") >= 0) {
    moCua("HTTP API Local");
  } else if (body.indexOf("\"open\":false") >= 0 || body.indexOf("\"action\":\"CLOSE\"") >= 0) {
    dongCua();
  }

  String phanHoi = "{\"success\":true,\"gate\":" + String(trangThaiCua ? "true" : "false") + "}";
  server.send(200, "application/json", phanHoi);
}

// POST /api/light - Điều khiển bật tắt đèn LED tức thì qua mạng LAN
void xuLyDieuKhienDen() {
  thietLapCORS();
  String body = server.arg("plain");
  Serial.print("[HTTP API] Yeu cau dieu khien den: ");
  Serial.println(body);

  if (body.indexOf("\"light\":true") >= 0 || body.indexOf("\"on\":true") >= 0) {
    datTrangThaiDen(true, "HTTP API Local");
  } else {
    datTrangThaiDen(false, "HTTP API Local");
  }

  String phanHoi = "{\"success\":true,\"light\":" + String(trangThaiDen ? "true" : "false") + "}";
  server.send(200, "application/json", phanHoi);
}

// ==================================================
// 13. KẾT NỐI MẠNG WI-FI
// ==================================================

void ketNoiWiFi() {
  Serial.println();
  Serial.print("[WIFI] Dang ket noi toi SSID: ");
  Serial.println(ssid);

  hienThi("DANG KET NOI", "WIFI...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long thoiGianBatDau = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - thoiGianBatDau < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("[WIFI] KET NOI THANH CONG!");
    Serial.print("[WIFI] IP ESP32: ");
    Serial.println(WiFi.localIP());

    hienThi("WIFI CONNECTED", WiFi.localIP().toString());
    delay(2000);
  } else {
    Serial.println();
    Serial.println("[WIFI] Ket noi that bai! He thong chay che do Ngoai tuyen (Offline).");
    hienThi("WIFI THAT BAI", "CHAY OFFLINE");
    delay(2000);
  }
}

// ==================================================
// 14. HÀM KHỞI TẠO SETUP
// ==================================================

void setup() {
  // Khởi tạo cổng truyền thông nối tiếp Serial Monitor tốc độ 115200 bps
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n================================================");
  Serial.println("  KHOA CUA THONG MINH ESP32 - NHOM 3 (FIREBASE)");
  Serial.println("================================================");

  // Cấu hình chân còi báo động
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Cấu hình chân đèn LED D2
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Khởi tạo giao tiếp I2C cho màn hình LCD
  Wire.begin(LCD_SDA, LCD_SCL);
  lcd.init();
  lcd.backlight();
  hienThi("KHOA CUA ESP32", "DANG KHOI DONG");

  // Khởi tạo động cơ Servo điều khiển chốt khóa cổng
  servoCua.setPeriodHertz(50);
  servoCua.attach(SERVO_PIN, 500, 2400);
  servoCua.write(GOC_DONG_CUA);

  // Khởi động cảm biến nhiệt độ & độ ẩm DHT11
  dht.begin();

  // Khởi tạo giao tiếp SPI cho đầu đọc thẻ RFID RC522
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  rfid.PCD_Init();
  delay(10);
  rfid.PCD_SetAntennaGain(rfid.RxGain_max); // Tối đa hóa độ nhạy anten giúp bắt thẻ từ xa hơn
  Serial.print("[RFID] Phien ban chip RC522: ");
  rfid.PCD_DumpVersionToSerial(); // Tu dong chan doan loi day noi len Serial Monitor

  // Tải thẻ Master đã lưu từ bộ nhớ Flash NVS
  docTheMaster();
  delay(1000);

  // Kết nối mạng Wi-Fi
  ketNoiWiFi();

  // Cấu hình định tuyến cho Web Server nội bộ cổng 80
  server.on("/api/sensors", HTTP_GET, xuLyLayCamBien);
  server.on("/api/gate", HTTP_POST, xuLyDieuKhienCua);
  server.on("/api/light", HTTP_POST, xuLyDieuKhienDen);
  server.on("/api/sensors", HTTP_OPTIONS, xuLyOptions);
  server.on("/api/gate", HTTP_OPTIONS, xuLyOptions);
  server.on("/api/light", HTTP_OPTIONS, xuLyOptions);
  server.onNotFound(xuLyOptions);
  server.begin();
  Serial.println("[WEB SERVER] Da khoi dong o cong 80!");

  // Gửi trạng thái ban đầu lên Firebase nếu đã có mạng Wi-Fi
  if (WiFi.status() == WL_CONNECTED) {
    guiDuLieuCloud();
  }

  // Cập nhật giao diện màn hình LCD ban đầu
  if (uidTheMaster.length() == 0) {
    hienThi("CHUA CO MASTER", "QUET THE DAU TIEN");
  } else {
    hienThi("HE THONG SAN SANG", "QUET THE RFID");
  }

  phatCoi(1500, 150);
  Serial.println("[HE THONG] San sang hoat dong!");
}

// ==================================================
// 15. VÒNG LẶP CHÍNH LOOP
// ==================================================

void loop() {
  // 1. Lắng nghe và xử lý yêu cầu HTTP từ Web Server nội bộ (Port 80)
  server.handleClient();

  // 2. Đọc định kỳ dữ liệu cảm biến DHT11
  docCamBienDHT();

  // 3. Cập nhật thông số nhiệt độ và độ ẩm lên màn hình LCD
  capNhatLCD();

  // 4. Lắng nghe và kiểm tra quẹt thẻ RFID RC522
  kiemTraRFID();

  // 5. Tự động đóng cổng sau thời gian mở quy định (4 giây)
  if (dangDemThoiGianDongCua && (millis() - thoiGianMoCuaTuDong >= THOI_GIAN_MO_CUA)) {
    dongCua();
  }

  // 6. Định kỳ đồng bộ dữ liệu telemetry lên Firebase Realtime Database mỗi 4 giây
  if (WiFi.status() == WL_CONNECTED && millis() - thoiGianGuiCloud >= 4000) {
    thoiGianGuiCloud = millis();
    guiDuLieuCloud();
  }

  // 7. Quét nhận lệnh điều khiển từ xa qua Firebase Realtime DB mỗi 800ms
  kiemTraLenhFirebase();
}
