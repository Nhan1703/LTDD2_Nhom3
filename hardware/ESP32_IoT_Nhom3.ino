/*
  ==============================================================
  ĐỒ ÁN LẬP TRÌNH DI ĐỘNG (LTDD) - NHÓM 3
  MÃ NGUỒN VI ĐIỀU KHIỂN ESP32 KẾT NỐI APP EXPO GO
  
  CÁC CẢM BIẾN VÀ THIẾT BỊ:
  1. Cảm biến Nước / Mực nước (Water Level / Rain Sensor) -> GPIO 34 (Analog)
  2. Cảm biến Âm thanh (Sound Sensor / Microphone) -> GPIO 35 (Analog)
  3. Cảm biến Nhiệt độ & Độ ẩm (DHT11 / DHT22) -> GPIO 4 (Digital)
  4. Cổng ra vào (Servo Motor SG90 / Chốt khóa từ Relay) -> GPIO 18 (PWM)
  ==============================================================
*/

#include <WiFi.h>
#include <PubSubClient.h> // Cài thư viện "PubSubClient" bởi Nick O'Leary
#include <DHT.h>          // Cài thư viện "DHT sensor library" bởi Adafruit
#include <ESP32Servo.h>   // Cài thư viện "ESP32Servo" bởi Kevin Harrington

// ----- THÔNG TIN WIFI CỦA BẠN -----
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ----- THÔNG TIN MQTT BROKER MIỄN PHÍ HOẶC SERVER RIÊNG -----
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;
const char* topic_sub_gate = "smart_home_group3/gate/set";
const char* topic_pub_telemetry = "smart_home_group3/telemetry";

// ----- ĐỊNH NGHĨA CHÂN KẾT NỐI PHẦN CỨNG -----
#define PIN_WATER 34      // Chân Analog A0 của cảm biến nước
#define PIN_SOUND 35      // Chân Analog A0 của cảm biến âm thanh
#define PIN_DHT 4         // Chân Data của DHT11
#define DHTTYPE DHT11     // Đổi thành DHT22 nếu nhóm dùng cảm biến DHT22
#define PIN_SERVO 18      // Chân tín hiệu điều khiển Servo cổng

DHT dht(PIN_DHT, DHTTYPE);
Servo gateServo;
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastSend = 0;
bool isGateOpen = false;

// Hàm mở / đóng cổng qua Servo
void setGate(bool open) {
  isGateOpen = open;
  if (open) {
    gateServo.write(90); // Mở 90 độ
    Serial.println(">>> CỔNG ĐÃ MỞ!");
  } else {
    gateServo.write(0);  // Đóng 0 độ
    Serial.println(">>> CỔNG ĐÃ ĐÓNG & KHÓA!");
  }
}

// Xử lý lệnh nhận được từ App Expo Go qua MQTT
void callback(char* topic, byte* message, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) {
    msg += (char)message[i];
  }
  Serial.print("Nhan duoc lenh tu App [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(msg);

  if (String(topic) == topic_sub_gate) {
    if (msg == "OPEN" || msg == "1" || msg == "true") {
      setGate(true);
    } else if (msg == "CLOSE" || msg == "0" || msg == "false") {
      setGate(false);
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Dang ket noi MQTT Broker...");
    String clientId = "ESP32_Client_Group3_" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println(" DA KET NOI!");
      client.subscribe(topic_sub_gate);
    } else {
      Serial.print(" That bai, rc=");
      Serial.print(client.state());
      Serial.println(" Thu lai sau 3 giay");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- HE THONG IOT NHOM 3 KHOI DONG ---");

  dht.begin();
  gateServo.attach(PIN_SERVO);
  setGate(false); // Ban đầu khóa cổng

  // Kết nối WiFi
  Serial.print("Dang ket noi WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi da ket noi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Đọc dữ liệu và gửi lên App mỗi 3 giây
  unsigned long now = millis();
  if (now - lastSend > 3000) {
    lastSend = now;

    // 1. Đọc cảm biến nhiệt độ & độ ẩm
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (isnan(t) || isnan(h)) {
      t = 28.5; // Giá trị fallback nếu chưa cắm DHT
      h = 65.0;
    }

    // 2. Đọc cảm biến nước (ADC 0 - 4095) quy đổi ra %
    int rawWater = analogRead(PIN_WATER);
    int waterPercent = map(rawWater, 0, 4095, 0, 100);

    // 3. Đọc cảm biến âm thanh (ADC quy đổi dB xấp xỉ)
    int rawSound = analogRead(PIN_SOUND);
    int soundDB = map(rawSound, 0, 4095, 30, 110);

    // Định dạng chuỗi JSON gửi lên App
    char jsonBuffer[256];
    snprintf(jsonBuffer, sizeof(jsonBuffer),
      "{\"temp\":%.1f,\"hum\":%.1f,\"water\":%d,\"sound\":%d,\"gate\":%s}",
      t, h, waterPercent, soundDB, isGateOpen ? "true" : "false"
    );

    Serial.print("Gui du lieu len App: ");
    Serial.println(jsonBuffer);
    client.publish(topic_pub_telemetry, jsonBuffer);
  }
}
