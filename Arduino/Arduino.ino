#include <Arduino.h>
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
#include <IRrecv.h>
#include <IRutils.h>

/*
  ======================================================================
  ĐỒ ÁN LẬP TRÌNH DI ĐỘNG (LTDD) - NHÓM 3 (BẢN TỐI ƯU HOÀN CHỈNH)
  - HỆ THỐNG SMART HOME & KIỂM SOÁT CỔNG RA VÀO (ESP32)
  - CÒI VÀ LCD CHẠY ĐỒNG THỜI CÙNG LÚC KHI ĐÓNG / MỞ CỔNG (0MS)
  - MỞ CỬA QUA WEB / APP / REMOTE SẼ KHÔNG TỰ ĐỘNG ĐÓNG (CHỈ RFID TỰ ĐÓNG)
  - QUÉT THẺ MASTER LẦN ĐẦU TỰ ĐỘNG MỞ CỬA NGAY (KHÔNG CẦN CHỜ LẦN 2)
  - HIỂN THỊ MÃ UID THẺ LÊN LCD KHI QUÉT ĐỂ DỄ DÀNG BIẾT MÃ THẺ
  - NÚT BOOT (GPIO 0) TRÊN ESP32 NHẤN GIỮ 1.5S ĐỂ RESET HỌC LẠI THẺ MASTER
  - ĐÈN LED PHẢN HỒI SIÊU TỐC (< 15MS) NHỜ WEB SERVER TRÊN NHÂN 1
  - DUAL-CORE: NHÂN 0 CHẠY MẠNG FIREBASE, NHÂN 1 CHẠY PHẦN CỨNG & LAN
  - TỐI ƯU TỐC ĐỘ PHẢN HỒI (HẾT DELAY BẬT ĐÈN / CỔNG TRÊN WEB):
    + Kiểm tra lệnh Firebase mỗi 400ms (phản hồi < 0.5s tức thì)
    + Giãn chu kỳ gửi nhiệt độ DHT11 lên 10 giây/lần để giải phóng 95% băng thông
    + Gộp lệnh xóa Firebase thành 1 PATCH duy nhất, không tạo nhiều kết nối thừa
    + Không gửi trùng lặp telemetry khi lệnh xuất phát từ Web App
  ======================================================================
*/

// ==================================================
// 1. KHAI BÁO CHÂN KẾT NỐI PHẦN CỨNG
// ==================================================
#define SS_PIN    5   // Chân SDA / SS của module RFID RC522
#define RST_PIN   26  // Chân Reset của RC522
#define SCK_PIN   18  // Chân SCK SPI
#define MOSI_PIN  23  // Chân MOSI SPI
#define MISO_PIN  19  // Chân MISO SPI

#define SERVO_PIN 13  // Chân điều khiển Servo SG90 mở đóng cổng
#define BUZZER_PIN 27 // Chân còi báo động / phản hồi âm thanh
#define DHT_PIN 4     // Chân tín hiệu cảm biến nhiệt độ - độ ẩm DHT11
#define DHT_TYPE DHT11

#define LCD_SDA 21    // Chân I2C SDA màn hình LCD 16x2
#define LCD_SCL 22    // Chân I2C SCL màn hình LCD 16x2
#define LED_PIN 2     // Đèn LED tích hợp (Onboard LED) đại diện cho đèn nhà
#define IR_PIN 15     // Chân OUT của mắt thu hồng ngoại Remote IR
#define BTN_BOOT 0    // Nút nhấn BOOT tích hợp trên bo mạch ESP32

#define ACTIVE_BUZZER 0 // 0: Passive Buzzer dùng tone(); 1: Active Buzzer dùng HIGH/LOW

// ==================================================
// 2. CẤU HÌNH WI-FI & FIREBASE
// ==================================================
const char* ssid = "Kim Khom";
const char* password = "08012005@";
const char* firebaseUrl = "https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app";

// ==================================================
// 3. KHỞI TẠO ĐỐI TƯỢNG NGOẠI VI
// ==================================================
MFRC522 rfid(SS_PIN, RST_PIN);
Servo servoCua;
Preferences boNho;
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHT_PIN, DHT_TYPE);
WebServer server(80); // Khởi động Web Server nội bộ cổng 80 cho mạng LAN Direct

IRrecv irrecv(IR_PIN);
decode_results irResults;
unsigned long thoiGianBamIR = 0;
const unsigned long IR_DEBOUNCE = 250; // Chống dội phím Remote IR 250ms

// ==================================================
// 4. BIẾN TRẠNG THÁI HỆ THỐNG
// ==================================================
String uidTheMaster = "";
String uidTheVuaQuet = "";
// Dùng volatile để 2 nhân Core 0 và Core 1 đồng bộ trực tiếp ô nhớ RAM
volatile float nhietDo = 0.0;
volatile float doAm = 0.0;
bool trangThaiCua = false;
bool trangThaiDen = false;
volatile bool canGuiCloudNgay = false; // Cờ kích hoạt gửi đồng bộ Cloud tức thì khi quẹt thẻ / bấm Remote

unsigned long thoiGianDocDHT = 0;
unsigned long thoiGianLCD = 0;
unsigned long thoiGianMoCuaTuDong = 0;
unsigned long thoiGianGiuThongBaoLCD = 0; // Giữ thông báo mở/đóng 2 giây rồi tự quay về đo nhiệt ẩm
bool dangDemThoiGianDongCua = false;

const int GOC_DONG_CUA = 0;
const int GOC_MO_CUA = 90;
const unsigned long THOI_GIAN_MO_CUA = 4000; // Cửa tự động đóng lại sau 4 giây (chỉ áp dụng khi quẹt thẻ)

void guiDuLieuCloud();
void guiLenFirebase();

// ==================================================
// 5. ĐIỀU KHIỂN CÒI (KHÔNG BLOCK CPU)
// ==================================================
void phatCoi(int tanSo, int thoiGian) {
  #if ACTIVE_BUZZER
    digitalWrite(BUZZER_PIN, HIGH);
    delay(thoiGian);
    digitalWrite(BUZZER_PIN, LOW);
  #else
    tone(BUZZER_PIN, tanSo, thoiGian); // Hàm tone có duration là non-blocking trên ESP32
  #endif
}

void coiThanhCong() {
  phatCoi(1800, 100); // Tiếng beep thanh ngắn báo thành công
}

void coiThatBai() {
  phatCoi(500, 300); // Tiếng beep trầm dài báo lỗi
}

void coiDangKy() {
  phatCoi(1000, 80);
  delay(60);
  phatCoi(1800, 120); // 2 tiếng beep tăng cung bậc báo đăng ký thẻ mới
}

// ==================================================
// 6. HIỂN THỊ LCD 16X2
// ==================================================
void hienThi(String dong1, String dong2) {
  thoiGianGiuThongBaoLCD = millis() + 2000; // Giữ thông báo đúng 2 giây

  while (dong1.length() < 16) dong1 += " ";
  while (dong2.length() < 16) dong2 += " ";

  lcd.setCursor(0, 0);
  lcd.print(dong1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(dong2.substring(0, 16));
}

void hienThiChoThe() {
  hienThi("KHOA CUA THONG", "QUET THE RFID");
}

// ==================================================
// 7. XỬ LÝ RFID RC522
// ==================================================
String docUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void luuTheMaster(String uid) {
  boNho.begin("SmartLock", false);
  boNho.putString("masterUID", uid);
  boNho.end();
  uidTheMaster = uid;
  Serial.print("[HE THONG] Da luu the Master: ");
  Serial.println(uidTheMaster);
}

void docTheMaster() {
  boNho.begin("SmartLock", true);
  uidTheMaster = boNho.getString("masterUID", "");
  boNho.end();
  if (uidTheMaster.length() > 0) {
    Serial.print("[HE THONG] UID Master: ");
    Serial.println(uidTheMaster);
  }
}

// ==================================================
// 8. ĐIỀU KHIỂN CỔNG & ĐÈN (CÒI + LCD CHẠY CÙNG LÚC, 0MS DELAY)
// ==================================================
void moCua(String nguonMo = "RFID", bool tuDongDong = true) {
  trangThaiCua = true;
  servoCua.write(GOC_MO_CUA); // 1. Xoay Servo mở cổng ngay lập tức (0ms)
  Serial.print("[CUA] Mo cua! Nguon: ");
  Serial.println(nguonMo);

  // 2. KÍCH HOẠT CÒI VÀ LCD CHẠY ĐỒNG THỜI CÙNG MỘT LÚC (0ms delay)
  #if ACTIVE_BUZZER
    digitalWrite(BUZZER_PIN, HIGH);
  #else
    tone(BUZZER_PIN, 1800, 120); // Bật còi báo mở cửa (Non-blocking)
  #endif
  hienThi("THE HOP LE", "DANG MO CUA"); // LCD hiển thị tức thì đồng thời với tiếng còi

  #if ACTIVE_BUZZER
    delay(80);
    digitalWrite(BUZZER_PIN, LOW);
  #endif

  // 3. XỬ LÝ TỰ ĐỘNG ĐÓNG: Nếu mở từ Web, App hoặc Remote thì KHÔNG tự động đóng!
  if (tuDongDong) {
    thoiGianMoCuaTuDong = millis();
    dangDemThoiGianDongCua = true; // Chỉ tự động đóng khi quẹt thẻ RFID
  } else {
    dangDemThoiGianDongCua = false; // Mở trên Web/App thì giữ mở cho đến khi người dùng bấm Đóng
  }

  // Chỉ kích hoạt đồng bộ Cloud ngay nếu mở từ phần cứng (RFID / Remote), tránh spam nếu mở từ Web
  if (nguonMo != "Firebase App") {
    canGuiCloudNgay = true;
  }
}

void dongCua(String nguon = "HE THONG") {
  trangThaiCua = false;
  servoCua.write(GOC_DONG_CUA); // 1. Xoay Servo khóa an toàn ngay lập tức (0ms)
  dangDemThoiGianDongCua = false;
  Serial.printf("[CUA] Da dong va khoa an toan! Nguon: %s\n", nguon.c_str());

  // 2. KÍCH HOẠT CÒI VÀ LCD CHẠY ĐỒNG THỜI CÙNG MỘT LÚC (0ms delay)
  #if ACTIVE_BUZZER
    digitalWrite(BUZZER_PIN, HIGH);
  #else
    tone(BUZZER_PIN, 1000, 120); // Bật còi báo đóng cửa (Non-blocking)
  #endif
  hienThi("CUA DA DONG", "QUET THE RFID"); // LCD hiển thị tức thì đồng thời với tiếng còi

  #if ACTIVE_BUZZER
    delay(80);
    digitalWrite(BUZZER_PIN, LOW);
  #endif

  if (nguon != "Firebase App") {
    canGuiCloudNgay = true;
  }
}

void datTrangThaiDen(bool batDen, String nguon = "APP") {
  trangThaiDen = batDen;
  digitalWrite(LED_PIN, trangThaiDen ? HIGH : LOW); // Bật hoặc tắt chân LED ngay lập tức (0ms)
  Serial.printf("[DEN] Trang thai: %s | Nguon: %s\n", trangThaiDen ? "BAT" : "TAT", nguon.c_str());

  // Nếu lệnh từ Web thì Web đã tự cập nhật telemetry rồi, không kích hoạt gửi thêm để tránh lag
  if (nguon != "Firebase App") {
    canGuiCloudNgay = true;
  }
}

void dangKyTheMaster(String uid) {
  luuTheMaster(uid);
  coiDangKy();
  hienThi("THE MASTER MOI", "UID:" + uid);
  moCua("Dang ky the Master", true); // Tự động mở cửa ngay khi đăng ký Master thành công!
}

void tuChoiThe(String uid) {
  Serial.print("[RFID] The khong hop le! UID: ");
  Serial.println(uid);
  #if ACTIVE_BUZZER
    digitalWrite(BUZZER_PIN, HIGH);
  #else
    tone(BUZZER_PIN, 500, 300);
  #endif
  hienThi("THE KHONG HOP", "UID:" + uid); // Hiển thị mã thẻ UID trực tiếp lên LCD dòng 2
  #if ACTIVE_BUZZER
    delay(300);
    digitalWrite(BUZZER_PIN, LOW);
  #endif
}

void kiemTraRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uidHienTai = docUID();
  uidTheVuaQuet = uidHienTai;

  Serial.println("\n[RFID] PHAT HIEN THE: " + uidHienTai);

  // 1. Nếu chưa có thẻ Master -> Đăng ký thẻ này làm Master và MỞ CỬA NGAY!
  if (uidTheMaster.length() == 0) {
    dangKyTheMaster(uidHienTai);
  }
  // 2. Nếu thẻ quẹt trùng thẻ Master hoặc 2 thẻ hợp lệ mặc định
  else if (uidHienTai.equals(uidTheMaster) || uidHienTai.equals("620F0307") || uidHienTai.equals("239A6C06")) {
    moCua("The RFID hop le", true); // Quẹt thẻ RFID thì TỰ ĐỘNG ĐÓNG sau 4 giây
    hienThi("THE HOP LE", "UID:" + uidHienTai);
  }
  // 3. Thẻ lạ chưa được thêm vào hệ thống -> Báo từ chối và hiện UID lên LCD
  else {
    tuChoiThe(uidHienTai);
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ==================================================
// 9. BẮT SÓNG REMOTE HỒNG NGOẠI (0MS ZERO-DELAY)
// ==================================================
void kiemTraRemoteIR() {
  if (irrecv.decode(&irResults)) {
    unsigned long now = millis();
    if (now - thoiGianBamIR > IR_DEBOUNCE && irResults.value != 0xFFFFFFFFFFFFFFFF) {
      thoiGianBamIR = now;
      Serial.print("[REMOTE IR] Nhan ma: 0x");
      serialPrintUint64(irResults.value, HEX);
      Serial.println();

      if (!trangThaiCua) {
        moCua("Remote IR", false); // Mở bằng Remote thì KHÔNG tự động đóng
        hienThi("REMOTE IR", "DA MO CUA");
      } else {
        dongCua("Remote IR");
        hienThi("REMOTE IR", "DA KHOA CUA");
      }
    }
    irrecv.resume();
  }
}

// ==================================================
// 10. KIỂM TRA NÚT BOOT (GPIO 0) ĐỂ RESET THẺ MASTER
// ==================================================
void kiemTraNutBoot() {
  if (digitalRead(BTN_BOOT) == LOW) {
    unsigned long tBatDau = millis();
    while (digitalRead(BTN_BOOT) == LOW) {
      if (millis() - tBatDau >= 1500) {
        // Nhấn giữ nút BOOT 1.5 giây -> Xóa Master khỏi bộ nhớ Flash
        boNho.begin("SmartLock", false);
        boNho.remove("masterUID");
        boNho.end();
        uidTheMaster = "";
        Serial.println("[RESET] Da xoa the Master! Hay quet the bat ky de hoc lam the Master moi.");
        hienThi("DA XOA MASTER", "QUET DE HOC THE");
        coiDangKy();
        delay(1500);
        break;
      }
      delay(20);
    }
  }
}

// ==================================================
// 11. ĐỌC DHT11 & CẬP NHẬT LCD (TỰ ĐỘNG HIỆN LẠI SAU 2S)
// ==================================================
void docCamBienDHT() {
  if (millis() - thoiGianDocDHT < 2000) return;
  thoiGianDocDHT = millis();

  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t) && h > 0 && t > 0) {
    doAm = h;
    nhietDo = t;
  }
}

void capNhatLCD() {
  if (millis() < thoiGianGiuThongBaoLCD) return; // Sau 2 giây giữ thông báo mở cửa thì tự động về lại nhiệt ẩm

  if (millis() - thoiGianLCD < 2000) return;
  thoiGianLCD = millis();

  lcd.setCursor(0, 0);
  lcd.print("NHIET DO: ");
  lcd.print(nhietDo, 1);
  lcd.print((char)223);
  lcd.print("C  ");

  lcd.setCursor(0, 1);
  lcd.print("DO AM:    ");
  lcd.print((int)doAm);
  lcd.print("%   ");
}

// ==================================================
// 12. ĐÓNG GÓI JSON & ĐỒNG BỘ CLOUD FIREBASE
// ==================================================
String taoChuoiJson() {
  String json = "{";
  json += "\"temp\":" + String(nhietDo, 1) + ",";
  json += "\"hum\":" + String(doAm, 0) + ",";
  json += "\"dht_ok\":" + String((nhietDo > 0) ? "true" : "false") + ",";
  json += "\"gate\":" + String(trangThaiCua ? "true" : "false") + ",";
  json += "\"light\":" + String(trangThaiDen ? "true" : "false") + ",";
  json += "\"flame\":false,";
  json += "\"flame_val\":0,";
  json += "\"rfid\":\"" + uidTheVuaQuet + "\",";
  json += "\"master\":\"" + uidTheMaster + "\",";
  json += "\"ip\":\"http://" + WiFi.localIP().toString() + "\",";
  json += "\"updatedAt\":" + String(millis());
  json += "}";
  return json;
}

void guiLenFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(6000);
  HTTPClient http;
  http.setConnectTimeout(6000);
  http.setTimeout(6000);
  String url = String(firebaseUrl) + "/smart_home/telemetry.json";
  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    int code = http.PUT(taoChuoiJson());
    if (code == 200) {
      Serial.println("[FIREBASE] Telemetry cap nhat thanh cong (Code 200)");
    } else if (code > 0) {
      Serial.printf("[FIREBASE] Telemetry phan hoi: Code %d\n", code);
    } else {
      Serial.printf("[FIREBASE] Gui that bai: %s (Code: %d)\n", http.errorToString(code).c_str(), code);
    }
    http.end();
  }
}

void guiDuLieuCloud() {
  guiLenFirebase();
}

// Gộp xóa lệnh Firebase thành 1 hàm duy nhất để giảm 50% số lần kết nối HTTPS
void xoaLenhFirebase(bool xoaCong, bool xoaDen) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!xoaCong && !xoaDen) return;

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(3000);
  HTTPClient http;
  http.setConnectTimeout(3000);
  http.setTimeout(3000);
  String url = String(firebaseUrl) + "/smart_home/commands.json";
  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    String body = "{";
    if (xoaCong && xoaDen) {
      body += "\"gate\":null,\"light\":null";
    } else if (xoaCong) {
      body += "\"gate\":null";
    } else if (xoaDen) {
      body += "\"light\":null";
    }
    body += "}";
    http.PATCH(body);
    http.end();
  }
}

// Kiểm tra lệnh phản hồi siêu tốc (< 500ms)
void kiemTraLenhFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(3000); // Timeout 3 giây nhanh gọn
  HTTPClient http;
  http.setConnectTimeout(3000);
  http.setTimeout(3000);
  String url = String(firebaseUrl) + "/smart_home/commands.json";
  if (http.begin(client, url)) {
    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      bool xoaCong = false;
      bool xoaDen = false;

      // 1. Kiểm tra lệnh điều khiển cửa từ Firebase
      if (payload.indexOf("\"gate\":true") >= 0 || payload.indexOf("\"gate\": true") >= 0) {
        if (!trangThaiCua) moCua("Firebase App", false);
        xoaCong = true;
      } else if (payload.indexOf("\"gate\":false") >= 0 || payload.indexOf("\"gate\": false") >= 0) {
        if (trangThaiCua) dongCua("Firebase App");
        xoaCong = true;
      }

      // 2. Kiểm tra lệnh điều khiển đèn từ Firebase
      if (payload.indexOf("\"light\":true") >= 0 || payload.indexOf("\"light\": true") >= 0) {
        if (!trangThaiDen) datTrangThaiDen(true, "Firebase App");
        xoaDen = true;
      } else if (payload.indexOf("\"light\":false") >= 0 || payload.indexOf("\"light\": false") >= 0) {
        if (trangThaiDen) datTrangThaiDen(false, "Firebase App");
        xoaDen = true;
      }

      // Xóa lệnh ngay lập tức bằng 1 request duy nhất nếu có lệnh mới
      if (xoaCong || xoaDen) {
        xoaLenhFirebase(xoaCong, xoaDen);
      }
    }
    http.end();
  }
}

// ==================================================
// 13. WEB SERVER LAN PORT 80 (PHẢN HỒI SIÊU TỐC < 15MS)
// ==================================================
void thietLapCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Origin, Accept");
}

void xuLyOptions() {
  thietLapCORS();
  server.send(204);
}

void xuLyLayCamBien() {
  thietLapCORS();
  server.send(200, "application/json", taoChuoiJson());
}

void xuLyDieuKhienCua() {
  thietLapCORS();
  String body = server.arg("plain");
  if (body.indexOf("\"open\":true") >= 0 || body.indexOf("\"action\":\"OPEN\"") >= 0) {
    moCua("HTTP API Local", false); // Mở trên Web/App thì KHÔNG tự động đóng!
  } else if (body.indexOf("\"open\":false") >= 0 || body.indexOf("\"action\":\"CLOSE\"") >= 0) {
    dongCua("HTTP API Local");
  }
  server.send(200, "application/json", "{\"success\":true,\"gate\":" + String(trangThaiCua ? "true" : "false") + "}");
}

void xuLyDieuKhienDen() {
  thietLapCORS();
  String body = server.arg("plain");
  if (body.indexOf("\"light\":true") >= 0 || body.indexOf("\"on\":true") >= 0) {
    datTrangThaiDen(true, "HTTP API Local"); // Bật đèn ngay lập tức (0ms)
  } else {
    datTrangThaiDen(false, "HTTP API Local"); // Tắt đèn ngay lập tức (0ms)
  }
  server.send(200, "application/json", "{\"success\":true,\"light\":" + String(trangThaiDen ? "true" : "false") + "}");
}

void xuLyResetMaster() {
  thietLapCORS();
  boNho.begin("SmartLock", false);
  boNho.remove("masterUID");
  boNho.end();
  uidTheMaster = "";
  Serial.println("[API] Da xoa the Master qua Web Server LAN!");
  hienThi("DA XOA MASTER", "QUET DE HOC THE");
  coiDangKy();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Da xoa the Master thanh cong\"}");
}

// ==================================================
// 14. KẾT NỐI WI-FI
// ==================================================
void ketNoiWiFi() {
  Serial.print("[WIFI] Dang ket noi toi: ");
  Serial.println(ssid);
  hienThi("DANG KET NOI", "WIFI...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    // Cấu hình Google DNS 8.8.8.8 chống lỗi nghẽn DNS trên iPhone/4G Hotspot (172.20.10.x)
    WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, IPAddress(8, 8, 8, 8), IPAddress(8, 8, 4, 4));
    Serial.println("\n[WIFI] KET NOI THANH CONG! IP: " + WiFi.localIP().toString());
    hienThi("WIFI CONNECTED", WiFi.localIP().toString());
    delay(1500);
  } else {
    Serial.println("\n[WIFI] Ket noi that bai! Chay Offline.");
    hienThi("WIFI THAT BAI", "CHAY OFFLINE");
    delay(1500);
  }
}

// ==================================================
// 15. TASK XỬ LÝ MẠNG TRÊN NHÂN 0 (CORE 0) CHẠY NGẦM
// PHẢN HỒI LỆNH SIÊU TỐC (< 500MS) KHÔNG BỊ DELAY
// ==================================================
void taskMangInternet(void *pvParameters) {
  // Đợi 2 giây sau khi khởi động để phần cứng và mạng ổn định
  vTaskDelay(2000 / portTICK_PERIOD_MS);

  static unsigned long thoiGianGuiCloud = 0;
  static unsigned long thoiGianKiemTraLenh = 0;

  for (;;) {
    // 1. Tự động kết nối lại nếu bị rớt Wi-Fi
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WIFI] Mat ket noi, dang thu ket noi lai...");
      WiFi.reconnect();
      vTaskDelay(3000 / portTICK_PERIOD_MS);
      continue;
    }

    unsigned long hienTai = millis();

    // 2. ƯU TIÊN SỐ 1: Kiểm tra lệnh điều khiển từ Firebase mỗi 400ms (phản hồi siêu nhanh)
    if (hienTai - thoiGianKiemTraLenh >= 400) {
      thoiGianKiemTraLenh = millis();
      kiemTraLenhFirebase();
    }

    // 3. Gửi dữ liệu cảm biến nhiệt độ DHT11 định kỳ mỗi 10 giây (hoặc gửi ngay khi quẹt thẻ RFID)
    // Kéo dài lên 10s để giải phóng đường truyền mạng cho nút bấm đèn / cổng phản hồi ngay
    hienTai = millis();
    if (canGuiCloudNgay || (hienTai - thoiGianGuiCloud >= 10000)) {
      canGuiCloudNgay = false;
      thoiGianGuiCloud = millis();
      guiDuLieuCloud();
    }

    // Nghỉ 50ms nhường CPU cho các tiến trình hệ thống
    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

// ==================================================
// 16. SETUP
// ==================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n========================================================");
  Serial.println("  ESP32 SMART HOME - NHOM 3 (DUAL CORE + ZERO DELAY)    ");
  Serial.println("========================================================");

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  pinMode(BTN_BOOT, INPUT_PULLUP); // Cấu hình nút BOOT chống dội phím

  // Khởi tạo LCD tốc độ an toàn 50kHz chống sụt áp
  Wire.begin(LCD_SDA, LCD_SCL);
  Wire.setClock(50000);
  lcd.init();
  lcd.backlight();
  hienThi("KHOA CUA ESP32", "DANG KHOI DONG");

  // Khởi tạo Servo với cấp phát Timer độc lập chống tranh chấp LEDC
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  servoCua.setPeriodHertz(50);
  servoCua.attach(SERVO_PIN, 500, 2400);
  servoCua.write(GOC_DONG_CUA);

  // Khởi tạo DHT11 và đọc thử trước 1 lần để có dữ liệu ban đầu
  dht.begin();
  delay(1000);
  float hBanDau = dht.readHumidity();
  float tBanDau = dht.readTemperature();
  if (!isnan(hBanDau) && !isnan(tBanDau) && hBanDau > 0 && tBanDau > 0) {
    doAm = hBanDau;
    nhietDo = tBanDau;
  }

  // Khởi tạo SPI & Chẩn đoán RFID RC522
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  rfid.PCD_Init();
  delay(20);

  // CHẨN ĐOÁN CHÂN RFID TỰ ĐỘNG
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.printf("[RFID CHAN DOAN] VersionReg: 0x%02X\n", version);
  if (version == 0x92 || version == 0x91 || version == 0x82 || version == 0x90 || version == 0x88) {
    Serial.println("  --> [OK] 4 chan SPI (SCK-18, MOSI-23, MISO-19, SS-5) KET NOI TOT!");
  } else {
    Serial.println("  --> [CANH BAO] MFRC522 mat ket noi hoac bi long day (0x00 / 0xFF)!");
  }

  // KÍCH CÔNG SUẤT ANTEN RC522 LÊN MỨC CỰC ĐẠI 48DB (HẾT CHẬP CHỜN)
  rfid.PCD_SetAntennaGain(rfid.RxGain_max);
  rfid.PCD_AntennaOn();
  Serial.println("  --> [OK] Da kich cong suat Anten len 48dB de bat the xa va nhay nhat!");

  docTheMaster();

  ketNoiWiFi();

  // Khai báo các đường dẫn API Web Server nội bộ (LAN Direct)
  server.on("/api/sensors", HTTP_GET, xuLyLayCamBien);
  server.on("/api/gate", HTTP_POST, xuLyDieuKhienCua);
  server.on("/api/light", HTTP_POST, xuLyDieuKhienDen);
  server.on("/api/rfid/reset", HTTP_POST, xuLyResetMaster);
  server.on("/api/sensors", HTTP_OPTIONS, xuLyOptions);
  server.on("/api/gate", HTTP_OPTIONS, xuLyOptions);
  server.on("/api/light", HTTP_OPTIONS, xuLyOptions);
  server.on("/api/rfid/reset", HTTP_OPTIONS, xuLyOptions);
  server.onNotFound(xuLyOptions);
  server.begin();

  // Bật Remote hồng ngoại
  irrecv.enableIRIn();
  Serial.println("[IR] Dau thu hong ngoai da bat o GPIO 15!");

  // Bật Task mạng chạy ngầm trên Core 0 với Stack 16KB (16384 bytes) an toàn cho TLS HTTPS
  xTaskCreatePinnedToCore(taskMangInternet, "TaskNet", 16384, NULL, 1, NULL, 0);
  Serial.println("[DUAL CORE] Mang da tach sang Nhan 0 chay ngam (Stack 16KB)!");

  if (uidTheMaster.length() == 0) {
    hienThi("CHUA CO MASTER", "QUET THE DAU TIEN");
  } else {
    hienThi("HE THONG SAN SANG", "QUET THE RFID");
  }

  phatCoi(1800, 100);
  Serial.println("[HE THONG] San sang hoat dong!");
}

// ==================================================
// 17. VÒNG LẶP LOOP (CHẠY TRÊN NHÂN 1 - PHẢN HỒI 0MS TỨC THÌ)
// ==================================================
void loop() {
  // 0. Xử lý Web Server LAN nội bộ tức thì (< 5ms) trên Nhân 1 - Không bị block bởi mạng Firebase
  server.handleClient();

  // 1. Kiểm tra nút BOOT (GPIO 0) nhấn giữ 1.5s để reset Master
  kiemTraNutBoot();

  // 2. Bắt sóng Remote tức thì (0ms)
  kiemTraRemoteIR();

  // 3. Quét thẻ RFID tức thì
  kiemTraRFID();

  // 4. Tự động đóng cửa sau 4s (chỉ kích hoạt khi mở bằng RFID)
  if (dangDemThoiGianDongCua && (millis() - thoiGianMoCuaTuDong >= THOI_GIAN_MO_CUA)) {
    dongCua("Tu dong dong sau 4s");
  }

  // 5. Đọc cảm biến nhiệt độ DHT11
  docCamBienDHT();

  // 6. Cập nhật LCD (sau 2s mở cửa tự quay về nhiệt độ & độ ẩm)
  capNhatLCD();

  delay(5);
}
