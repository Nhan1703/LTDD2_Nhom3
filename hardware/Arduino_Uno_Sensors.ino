#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>
#include <EEPROM.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

/*
  ==============================================================
  ĐỒ ÁN LẬP TRÌNH DI ĐỘNG (LTDD) - NHÓM 3
  HỆ THỐNG IOT THÔNG MINH - ARDUINO UNO R3:
  - Cảm biến Nước & Ngập (A0) -> TRÊN 40% HÚ CÒI BUZZER (D4)
  - Cảm biến Âm thanh (A1) Peak-to-Peak -> >= 40 dB BẬT ĐÈN LED (D5) 5 giây
  - Cảm biến DHT11 (D2) -> Đọc nhiệt độ & độ ẩm thực tế
  - Cổng Servo SG90 (D3) & Đầu đọc thẻ RFID RC522 (D9, D10, D11, D12, D13)
  ==============================================================
*/

// --- ĐỊNH NGHĨA CHÂN NGOẠI VI (Arduino UNO) ---
#define DHTPIN 2              // Chân Data cảm biến DHT11
#define DHTTYPE DHT11         // Loại cảm biến DHT11
#define SERVO_PIN 3           // Chân điều khiển Servo SG90
#define BUZZER_PIN 4          // Chân còi báo động Buzzer
#define LED_PIN 5             // Chân điều khiển ĐÈN LED (Bật đèn khi có âm thanh)
#define RST_PIN 9             // Chân Reset RFID RC522
#define SS_PIN 10             // Chân SDA/SS của RFID RC522
#define WATER_SENSOR_PIN A0   // Chân Signal cảm biến ngập nước
#define SOUND_SENSOR_PIN A1   // Chân Analog (AO) cảm biến âm thanh

// Ngưỡng báo động & kích hoạt theo đúng yêu cầu
#define WATER_THRESHOLD 40    // Ngưỡng nước: TRÊN 40% là hú còi báo động!
#define SOUND_THRESHOLD 40    // Ngưỡng âm thanh: >= 40 dB là tự bật đèn LED

// Khởi tạo đối tượng
LiquidCrystal_I2C lcd(0x27, 16, 2); 
MFRC522 rfid(SS_PIN, RST_PIN);
Servo doorServo;
DHT dht(DHTPIN, DHTTYPE);

byte masterCard[4];
const byte EEPROM_CHECK_BYTE = 0xA5;

// Biến lưu thời gian & trạng thái
unsigned long lastDHTTime = 0;
unsigned long lastSerialSendTime = 0;
unsigned long lastLcdUpdateTime = 0;
unsigned long gateOpenedTime = 0;
unsigned long servoDetachTime = 0;
bool isServoAttached = false;
const unsigned long RFID_AUTO_CLOSE_DELAY = 6000; 

// Biến quản lý ĐÈN chiếu sáng tự động theo âm thanh
bool isLightOn = false;
unsigned long lightTurnOffTime = 0;
const unsigned long LIGHT_DURATION = 5000; // Đèn tự sáng trong 5 giây sau tiếng động

bool isGateOpen = false;
bool isOpenedByRFID = false; 
float currentTemp = 0.0;
float currentHum = 0.0;
bool isDHTConnected = false;
int lastSoundDB = 36;
int lastWaterPercent = 0;

// Lấy mẫu âm thanh Peak-to-Peak (cửa sổ 25ms) bắt trọn mọi sóng âm khi vỗ tay/nói chuyện
int getSoundLevel() {
  unsigned int signalMax = 0;
  unsigned int signalMin = 1024;
  unsigned long startMillis = millis();

  while (millis() - startMillis < 25) {
    int sample = analogRead(SOUND_SENSOR_PIN);
    if (sample < 1024) {
      if (sample > signalMax) signalMax = sample;
      if (sample < signalMin) signalMin = sample;
    }
  }

  int peakToPeak = signalMax - signalMin;
  int soundDB = map(peakToPeak, 0, 250, 35, 105);
  if (soundDB < 35) soundDB = 35;
  if (soundDB > 110) soundDB = 110;
  return soundDB;
}

// Đọc mực nước (%) - Lọc nhiễu tĩnh điện thông minh (Chống báo động giả khi chạm thẻ, chạm tay)
int getWaterLevel() {
  // Lấy trung bình 5 lần đọc để triệt tiêu hoàn toàn tĩnh điện
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(WATER_SENSOR_PIN);
    delayMicroseconds(50);
  }
  int waterRaw = sum / 5;

  // Ngưỡng cắt nhiễu: Dưới 150 (chạm thẻ nhựa, chạm tay, tĩnh điện) coi như 0%
  if (waterRaw < 150) return 0;

  // Khi ngập nước thật sự (waterRaw từ 150 đến 650) mới tính % ngập:
  int percent = map(waterRaw, 150, 650, 10, 100);
  if (percent > 100) percent = 100;
  return percent;
}

// Gửi dữ liệu JSON lên máy tính / App Expo Go (nhanh, realtime)
void sendDataToSerial(const char* action = NULL, const char* reason = NULL) {
  Serial.print(F("{\"water\":"));
  Serial.print(lastWaterPercent);
  Serial.print(F(",\"sound\":"));
  Serial.print(lastSoundDB);
  Serial.print(F(",\"temp\":"));
  Serial.print(isDHTConnected ? currentTemp : 30.0, 1);
  Serial.print(F(",\"hum\":"));
  Serial.print(isDHTConnected ? currentHum : 75.0, 1);
  Serial.print(F(",\"dht_ok\":"));
  Serial.print(isDHTConnected ? F("true") : F("false"));
  Serial.print(F(",\"gate\":"));
  Serial.print(isGateOpen ? F("true") : F("false"));
  Serial.print(F(",\"light\":"));
  Serial.print(isLightOn ? F("true") : F("false"));
  if (action != NULL) {
    Serial.print(F(",\"action\":\""));
    Serial.print(action);
    Serial.print(F("\",\"reason\":\""));
    Serial.print(reason);
    Serial.print(F("\""));
  }
  Serial.println(F("}"));
}

// Đọc dữ liệu từ DHT11
void updateDHTData() {
  if (millis() - lastDHTTime >= 2000 || lastDHTTime == 0) {
    lastDHTTime = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    
    if (!isnan(t) && !isnan(h)) {
      // Khử lỗi tràn bit bộ nhớ của thư viện DHT (nếu bị biến thành 4278190105...)
      if (t > 100.0) {
        unsigned long rawT = (unsigned long)t;
        t = (float)(rawT & 0xFF);
      }
      if (h > 100.0) {
        unsigned long rawH = (unsigned long)h;
        h = (float)(rawH & 0xFF);
      }

      if (t >= 10.0 && t <= 55.0 && h >= 15.0 && h <= 99.0) {
        currentTemp = t;
        currentHum = h;
        isDHTConnected = true;
        return;
      }
    }
    isDHTConnected = false;
  }
}

// Cập nhật giao diện màn hình LCD
void displayStandby() {
  updateDHTData();

  lcd.setCursor(0, 0);
  if (!isDHTConnected) {
    lcd.print(F("DHT11: LOI D2   "));
  } else {
    lcd.print(F("T:"));
    lcd.print((int)currentTemp);
    lcd.print((char)223);
    lcd.print(F("C H:"));
    lcd.print((int)currentHum);
    lcd.print(F("% "));
    lcd.print(isLightOn ? F("L:ON ") : F("L:OFF"));
  }

  lcd.setCursor(0, 1);
  if (isGateOpen) {
    lcd.print(F(">> CONG DANG MO "));
  } else {
    lcd.print(F("Quet the de mo  "));
  }
}

// CÒI BÁO ĐỘNG NGẬP NƯỚC (Dùng điện áp trực tiếp HIGH/LOW cho còi Active Buzzer kêu to vang 100%)
void beepWaterAlert() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(150);
  digitalWrite(BUZZER_PIN, LOW);
  delay(80);
}

void beepSuccess() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(70);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
}

void beepAlarm() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(350);
  digitalWrite(BUZZER_PIN, LOW);
}

// Hàm mở cửa
void openDoor(const char* reason, bool fromRFID = false) {
  isGateOpen = true;
  isOpenedByRFID = fromRFID;
  gateOpenedTime = millis();

  if (!isServoAttached) {
    doorServo.attach(SERVO_PIN);
    isServoAttached = true;
  }
  doorServo.write(90);
  servoDetachTime = millis() + 800;

  lcd.setCursor(0, 0);
  lcd.print(F("MO CUA:         "));
  lcd.setCursor(8, 0);
  lcd.print(reason);
  lcd.setCursor(0, 1);
  lcd.print(F(">> CONG DANG MO "));
  beepSuccess();

  sendDataToSerial("OPEN", reason);
}

// Hàm đóng cửa
void closeDoor(const char* reason = "Dong cua") {
  isGateOpen = false;
  isOpenedByRFID = false;

  if (!isServoAttached) {
    doorServo.attach(SERVO_PIN);
    isServoAttached = true;
  }
  doorServo.write(0);
  servoDetachTime = millis() + 800;

  displayStandby();
  sendDataToSerial("CLOSE", reason);
}

// Kiểm tra lệnh nhận từ máy tính / App (phản hồi siêu nhanh trong 30ms)
void checkSerialCommands() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "GATE_OPEN" || command == "OPEN" || command == "1") {
      openDoor("Mo qua App", false);
    } else if (command == "GATE_CLOSE" || command == "CLOSE" || command == "0") {
      closeDoor("Dong qua App");
    } else if (command == "LIGHT_ON") {
      isLightOn = true;
      digitalWrite(LED_PIN, HIGH);
      lightTurnOffTime = millis() + LIGHT_DURATION;
      displayStandby();
      sendDataToSerial("LIGHT_ON", "Bat den D5");
    } else if (command == "LIGHT_OFF") {
      isLightOn = false;
      digitalWrite(LED_PIN, LOW);
      displayStandby();
      sendDataToSerial("LIGHT_OFF", "Tat den D5");
    } else if (command == "LIGHT_TOGGLE") {
      isLightOn = !isLightOn;
      digitalWrite(LED_PIN, isLightOn ? HIGH : LOW);
      if (isLightOn) lightTurnOffTime = millis() + LIGHT_DURATION;
      displayStandby();
      sendDataToSerial(isLightOn ? "LIGHT_ON" : "LIGHT_OFF", "Chuyen den D5");
    }
  }
}

void setup() {
  Serial.begin(9600);
  Serial.setTimeout(30);

  // 1. Khởi động màn hình LCD & DHT11
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print(F("DANG KHOI DONG.."));

  pinMode(DHTPIN, INPUT_PULLUP);
  dht.begin();

  // 2. Cài đặt chân Còi, Đèn và Cảm biến
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  pinMode(WATER_SENSOR_PIN, INPUT);
  pinMode(SOUND_SENSOR_PIN, INPUT);

  // 3. TEST ĐÈN LED KHI KHỞI ĐỘNG (Nhấp nháy 3 lần)
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(120);
    digitalWrite(LED_PIN, LOW);
    delay(120);
  }

  // 4. TEST CÒI BUZZER KHI KHỞI ĐỘNG (Bíp 2 tiếng to rõ ràng)
  beepSuccess();

  // 5. Khởi tạo Servo về 0 độ
  doorServo.attach(SERVO_PIN);
  doorServo.write(0);
  delay(500);
  doorServo.detach();
  isServoAttached = false;

  // 6. Khởi động RFID RC522
  SPI.begin();
  rfid.PCD_Init();
  delay(50);

  updateDHTData();

  // 7. Kiểm tra thẻ chủ EEPROM
  if (EEPROM.read(0) == EEPROM_CHECK_BYTE) {
    for (byte i = 0; i < 4; i++) {
      masterCard[i] = EEPROM.read(i + 1);
    }
    displayStandby();
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(F("CHUA CO THE CHU!"));
    lcd.setCursor(0, 1);
    lcd.print(F("Quet the bat ky"));
  }
}

void loop() {
  // 1. Luôn lắng nghe lệnh từ App (không trễ)
  checkSerialCommands();

  // 2. Tự ngắt servo sau khi xoay để tránh nóng động cơ
  if (isServoAttached && millis() > servoDetachTime) {
    doorServo.detach();
    isServoAttached = false;
  }

  // 3. Tự động đóng cổng sau 6s nếu mở bằng quẹt thẻ RFID
  if (isGateOpen && isOpenedByRFID && (millis() - gateOpenedTime >= RFID_AUTO_CLOSE_DELAY)) {
    closeDoor("RFID tu dong dong");
  }

  // 4. KIỂM TRA CẢM BIẾN ÂM THANH (Lấy mẫu đỉnh sóng Peak-to-Peak)
  lastSoundDB = getSoundLevel();

  // Nếu âm thanh >= 40 dB -> TỰ ĐỘNG BẬT ĐÈN D5!
  if (lastSoundDB >= SOUND_THRESHOLD) {
    if (!isLightOn) {
      isLightOn = true;
      digitalWrite(LED_PIN, HIGH); // BẬT ĐÈN NGAY
      displayStandby();
      sendDataToSerial("LIGHT_ON", "Am thanh bat den");
    }
    lightTurnOffTime = millis() + LIGHT_DURATION; // Gia hạn sáng thêm 5 giây
  }

  // Hết 5 giây yên tĩnh -> TỰ ĐỘNG TẮT ĐÈN
  if (isLightOn && millis() > lightTurnOffTime) {
    isLightOn = false;
    digitalWrite(LED_PIN, LOW); // TẮT ĐÈN
    displayStandby();
    sendDataToSerial("LIGHT_OFF", "Het 5s tu tat den");
  }

  // 5. KIỂM TRA CẢM BIẾN NƯỚC: TRÊN 40% THÌ HÚ CÒI BÁO ĐỘNG!
  lastWaterPercent = getWaterLevel();
  if (lastWaterPercent >= WATER_THRESHOLD) {
    static unsigned long lastWaterAlertTime = 0;
    if (millis() - lastWaterAlertTime >= 350) {
      lastWaterAlertTime = millis();
      beepWaterAlert(); // Còi D4 hú báo động TÍT TÍT!
      sendDataToSerial("ALERT", "Phat hien ngap nuoc tren 40%");

      lcd.setCursor(0, 0);
      lcd.print(F("! CANH BAO !    "));
      lcd.setCursor(0, 1);
      lcd.print(F("NGAP NUOC: "));
      lcd.print(lastWaterPercent);
      lcd.print(F("%   "));
    }
    return; // Đang ngập nước thì ưu tiên cảnh báo
  }

  // 6. Gửi dữ liệu JSON lên máy tính mỗi 400ms (nhanh, realtime)
  if (millis() - lastSerialSendTime >= 400) {
    lastSerialSendTime = millis();
    sendDataToSerial();
  }

  // 7. Cập nhật màn hình LCD định kỳ mỗi 1 giây
  if (millis() - lastLcdUpdateTime >= 1000) {
    lastLcdUpdateTime = millis();
    displayStandby();
  }

  // 8. Quét nhận diện thẻ RFID
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // TH 1: Đăng ký thẻ chủ lần đầu
  if (EEPROM.read(0) != EEPROM_CHECK_BYTE) {
    for (byte i = 0; i < 4; i++) {
      masterCard[i] = rfid.uid.uidByte[i];
      EEPROM.write(i + 1, masterCard[i]);
    }
    EEPROM.write(0, EEPROM_CHECK_BYTE);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(F("DANG KY THE CHU"));
    lcd.setCursor(0, 1);
    lcd.print(F("   THANH CONG!  "));
    beepSuccess();
    delay(1500);
    displayStandby();

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    rfid.PCD_Init();
    return;
  }

  // TH 2: So khớp thẻ mở cửa
  bool isMatch = true;
  for (byte i = 0; i < 4; i++) {
    if (rfid.uid.uidByte[i] != masterCard[i]) {
      isMatch = false;
      break;
    }
  }

  if (isMatch) {
    openDoor("The RFID", true); 
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(F(" THE SAI/KHONG RO "));
    lcd.setCursor(0, 1);
    lcd.print(F(" TU CHOI MO CUA! "));
    beepAlarm();
    delay(1000);
    displayStandby();
    sendDataToSerial("DENIED", "The RFID sai");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  rfid.PCD_Init();
}
