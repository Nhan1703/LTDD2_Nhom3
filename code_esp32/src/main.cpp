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
  - KIẾN TRÚC DUAL-CORE: NHÂN 0 CHẠY MẠNG FIREBASE, NHÂN 1 CHẠY PHẦN CỨNG 0MS
  - TÍCH HỢP REMOTE HỒNG NGOẠI (BẤM MỞ / BẤM KHÓA)
  - TỰ ĐỘNG CHẨN ĐOÁN & KÍCH SÓNG ANTEN RFID LÊN CỰC ĐẠI 48DB
  - LCD TỰ PHỤC HỒI CHỐNG SỤT ÁP, HIỆN TRẠNG THÁI 2S RỒI VỀ NHIỆT ẨM
  ======================================================================
*/

// ==================================================
// 1. KHAI BÁO CHÂN KẾT NỐI PHẦN CỨNG
// ==================================================
#define SS_PIN    5   // SDA / SS của RC522
#define RST_PIN   26  // Reset của RC522
#define SCK_PIN   18  // SCK SPI
#define MOSI_PIN  23  // MOSI SPI
#define MISO_PIN  19  // MISO SPI

#define SERVO_PIN 13  // Servo SG90 mở cổng
#define BUZZER_PIN 27 // Còi báo động
#define DHT_PIN 4     // Cảm biến DHT11
#define DHT_TYPE DHT11

#define LCD_SDA 21    // I2C SDA LCD 16x2
#define LCD_SCL 22    // I2C SCL LCD 16x2
#define LED_PIN 2     // LED onboard ESP32
#define IR_PIN 15     // Chân OUT đầu thu hồng ngoại

#define ACTIVE_BUZZER 0

// ==================================================
// 2. CẤU HÌNH WI-FI & FIREBASE
// ==================================================
const char* ssid = "Danh Ngoc";
const char* password = "0982555644";
const char* firebaseUrl = "https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app";

// ==================================================
// 3. KHỞI TẠO ĐỐI TƯỢNG NGOẠI VI
// ==================================================
MFRC522 rfid(SS_PIN, RST_PIN);
Servo servoCua;
Preferences boNho;
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHT_PIN, DHT_TYPE);
WebServer server(80);

IRrecv irrecv(IR_PIN);
decode_results irResults;
unsigned long thoiGianBamIR = 0;
const unsigned long IR_DEBOUNCE = 250;

// ==================================================
// 4. BIẾN TRẠNG THÁI HỆ THỐNG
// ==================================================
String uidTheMaster = "";
String uidTheVuaQuet = "";
float nhietDo = 0.0;
float doAm = 0.0;
bool trangThaiCua = false;
bool trangThaiDen = false;
volatile bool canGuiCloudNgay = false; // Cờ kích hoạt gửi đồng bộ Cloud tức thì khi trạng thái phần cứng đổi

unsigned long thoiGianDocDHT = 0;
unsigned long thoiGianLCD = 0;
unsigned long thoiGianMoCuaTuDong = 0;
unsigned long thoiGianGiuThongBaoLCD = 0; // Giữ thông báo mở/đóng 2 giây
bool dangDemThoiGianDongCua = false;

const int GOC_DONG_CUA = 0;
const int GOC_MO_CUA = 90;
const unsigned long THOI_GIAN_MO_CUA = 4000;

void guiDuLieuCloud();
void guiLenFirebase();

// ==================================================
// 5. ĐIỀU KHIỂN CÒI
// ==================================================
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

void coiThanhCong() {
  phatCoi(1800, 80);
}

void coiThatBai() {
  phatCoi(500, 300);
}

void coiDangKy() {
  phatCoi(1000, 80);
  delay(60);
  phatCoi(1800, 120);
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

void dangKyTheMaster(String uid) {
  luuTheMaster(uid);
  hienThi("DANG KY THANH", "CONG THE MASTER");
  coiDangKy();
  delay(1000);
  hienThiChoThe();
}

// ==================================================
// 8. ĐIỀU KHIỂN CỔNG & ĐÈN
// ==================================================
void moCua(String nguonMo = "RFID") {
  trangThaiCua = true;
  servoCua.write(GOC_MO_CUA); // Quay Servo mở tức thì (0ms)
  Serial.print("[CUA] Mo cua! Nguon: ");
  Serial.println(nguonMo);

  delay(40);
  lcd.init(); // Tự phục hồi LCD chống sụt áp nguồn do Servo giật
  lcd.backlight();

  hienThi("THE HOP LE", "DANG MO CUA");
  coiThanhCong();

  thoiGianMoCuaTuDong = millis();
  dangDemThoiGianDongCua = true;
  canGuiCloudNgay = true; // Kích hoạt gửi cập nhật tức thì lên Firebase
}

void dongCua() {
  trangThaiCua = false;
  servoCua.write(GOC_DONG_CUA); // Quay Servo khóa tức thì (0ms)
  dangDemThoiGianDongCua = false;
  Serial.println("[CUA] Da dong va khoa an toan!");

  delay(40);
  lcd.init();
  lcd.backlight();

  hienThi("CUA DA DONG", "QUET THE RFID");
  phatCoi(1000, 80);
  canGuiCloudNgay = true; // Kích hoạt gửi cập nhật tức thì lên Firebase
}

void datTrangThaiDen(bool batDen, String nguon = "APP") {
  trangThaiDen = batDen;
  digitalWrite(LED_PIN, trangThaiDen ? HIGH : LOW);
  Serial.printf("[DEN] Trang thai: %s | Nguon: %s\n", trangThaiDen ? "BAT" : "TAT", nguon.c_str());
  canGuiCloudNgay = true; // Kích hoạt gửi cập nhật tức thì lên Firebase
}

void tuChoiThe() {
  Serial.println("[RFID] The khong hop le!");
  hienThi("THE KHONG HOP", "TU CHOI MO CUA");
  coiThatBai();
}

void kiemTraRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uidHienTai = docUID();
  uidTheVuaQuet = uidHienTai;

  Serial.println("\n[RFID] PHAT HIEN THE MOI: " + uidHienTai);

  if (uidTheMaster.length() == 0) {
    dangKyTheMaster(uidHienTai);
  } else if (uidHienTai.equals(uidTheMaster) || uidHienTai.equals("620F0307") || uidHienTai.equals("239A6C06")) {
    moCua("The RFID hop le");
  } else {
    tuChoiThe();
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ==================================================
// 9. BỘ LỌC TRUNG VỊ (MEDIAN) + XẢ ĐIỆN DUNG CHỐNG CHÂN FLOATING (LƠ LỬNG)
// ==================================================
// 9. BẮT SÓNG REMOTE HỒNG NGOẠI (0MS ZERO-DELAY)
// ==================================================
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
        moCua("Remote IR");
        dangDemThoiGianDongCua = false; // Bấm remote thì giữ cửa mở, chờ bấm lại để đóng
        hienThi("REMOTE IR", "DA MO CUA");
      } else {
        dongCua();
        hienThi("REMOTE IR", "DA KHOA CUA");
      }
    }
    irrecv.resume();
  }
}

// ==================================================
// 10. ĐỌC DHT11 & CẬP NHẬT LCD (TỰ ĐỘNG HIỆN LẠI SAU 2S)
// ==================================================
void docCamBienDHT() {
  if (millis() - thoiGianDocDHT < 2000) return;
  thoiGianDocDHT = millis();

  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
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
// 11. ĐÓNG GÓI JSON & ĐỒNG BỘ CLOUD FIREBASE
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
  json += "\"updatedAt\":" + String(millis());
  json += "}";
  return json;
}

void guiLenFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(2);
  HTTPClient http;
  String url = String(firebaseUrl) + "/smart_home/telemetry.json";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  int code = http.PUT(taoChuoiJson());
  http.end();
  client.stop();
}

void guiDuLieuCloud() {
  guiLenFirebase();
}

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

void xoaLenhDenFirebase() {
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(2);
  HTTPClient http;
  String url = String(firebaseUrl) + "/smart_home/commands.json";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.PATCH("{\"light\":null}");
  http.end();
  client.stop();
}

void kiemTraLenhFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(1);

  HTTPClient http;
  http.setReuse(true);
  String url = String(firebaseUrl) + "/smart_home/commands.json";
  http.begin(client, url);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    if (payload.indexOf("\"gate\":true") >= 0) {
      xoaLenhCongFirebase();
      if (!trangThaiCua) moCua("Firebase App");
    } else if (payload.indexOf("\"gate\":false") >= 0) {
      xoaLenhCongFirebase();
      if (trangThaiCua) dongCua();
    }

    if (payload.indexOf("\"light\":true") >= 0) {
      xoaLenhDenFirebase();
      if (!trangThaiDen) datTrangThaiDen(true, "Firebase App");
    } else if (payload.indexOf("\"light\":false") >= 0) {
      xoaLenhDenFirebase();
      if (trangThaiDen) datTrangThaiDen(false, "Firebase App");
    }
  }
  http.end();
  client.stop();
}

// ==================================================
// 12. WEB SERVER LAN PORT 80
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
    moCua("HTTP API Local");
  } else if (body.indexOf("\"open\":false") >= 0 || body.indexOf("\"action\":\"CLOSE\"") >= 0) {
    dongCua();
  }
  server.send(200, "application/json", "{\"success\":true,\"gate\":" + String(trangThaiCua ? "true" : "false") + "}");
}

void xuLyDieuKhienDen() {
  thietLapCORS();
  String body = server.arg("plain");
  if (body.indexOf("\"light\":true") >= 0 || body.indexOf("\"on\":true") >= 0) {
    datTrangThaiDen(true, "HTTP API Local");
  } else {
    datTrangThaiDen(false, "HTTP API Local");
  }
  server.send(200, "application/json", "{\"success\":true,\"light\":" + String(trangThaiDen ? "true" : "false") + "}");
}

// ==================================================
// 13. KẾT NỐI WI-FI
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
// 14. TASK XỬ LÝ MẠNG TRÊN NHÂN 0 (CORE 0) CHẠY NGẦM
// ==================================================
void taskMangInternet(void *pvParameters) {
  for (;;) {
    if (WiFi.status() == WL_CONNECTED) {
      server.handleClient();
      kiemTraLenhFirebase();

      static unsigned long thoiGianGui = 0;
      // Gửi định kỳ mỗi 4 giây HOẶC gửi tức thì (0ms delay) ngay khi có lệnh điều khiển phần cứng mới
      if (canGuiCloudNgay || (millis() - thoiGianGui >= 4000)) {
        canGuiCloudNgay = false;
        thoiGianGui = millis();
        guiDuLieuCloud();
      }
    }
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}

// ==================================================
// 15. SETUP
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

  // Khởi tạo DHT11
  dht.begin();

  // Khởi tạo SPI & Chẩn đoán RFID RC522
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  rfid.PCD_Init();
  delay(20);

  // CHẨN ĐOÁN CHÂN RFID TỰ ĐỘNG
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.printf("[RFID CHAN DOAN] VersionReg: 0x%02X\n", version);
  if (version == 0x92 || version == 0x91) {
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

  // Web Server routes
  server.on("/api/sensors", HTTP_GET, xuLyLayCamBien);
  server.on("/api/gate", HTTP_POST, xuLyDieuKhienCua);
  server.on("/api/light", HTTP_POST, xuLyDieuKhienDen);
  server.on("/api/sensors", HTTP_OPTIONS, xuLyOptions);
  server.on("/api/gate", HTTP_OPTIONS, xuLyOptions);
  server.on("/api/light", HTTP_OPTIONS, xuLyOptions);
  server.onNotFound(xuLyOptions);
  server.begin();

  // Bật Remote hồng ngoại
  irrecv.enableIRIn();
  Serial.println("[IR] Dau thu hong ngoai da bat o GPIO 15!");

  // Bật Task mạng chạy ngầm độc lập trên Core 0
  xTaskCreatePinnedToCore(taskMangInternet, "TaskNet", 8192, NULL, 1, NULL, 0);
  Serial.println("[DUAL CORE] Mang da tach sang Nhan 0 chay ngam!");

  if (uidTheMaster.length() == 0) {
    hienThi("CHUA CO MASTER", "QUET THE DAU TIEN");
  } else {
    hienThi("HE THONG SAN SANG", "QUET THE RFID");
  }

  phatCoi(1800, 100);
  Serial.println("[HE THONG] San sang hoat dong!");
}

// ==================================================
// 16. VÒNG LẶP LOOP (CHẠY TRÊN NHÂN 1 - PHẢN HỒI 0MS TỨC THÌ)
// ==================================================
void loop() {
  // 1. Bắt sóng Remote tức thì (0ms)
  kiemTraRemoteIR();

  // 2. Quét thẻ RFID tức thì
  kiemTraRFID();

  // 3. Tự động đóng cửa sau 4s
  if (dangDemThoiGianDongCua && (millis() - thoiGianMoCuaTuDong >= THOI_GIAN_MO_CUA)) {
    dongCua();
  }

  // 4. Đọc cảm biến nhiệt độ DHT11
  docCamBienDHT();

  // 5. Cập nhật LCD (sau 2s mở cửa tự quay về nhiệt độ & độ ẩm)
  capNhatLCD();

  delay(5);
}
