/**
 * CẦU NỐI ARDUINO USB -> APP EXPO GO (NHÓM 3)
 * 
 * Mục đích:
 * Khi bạn cắm Arduino Uno vào máy tính qua cáp USB, Arduino sẽ gửi dữ liệu cảm biến
 * ra cổng COM (Serial). File này sẽ đọc từ cổng COM và mở một Web Server nội bộ (Port 5000)
 * để App điện thoại (Expo Go) kết nối và đọc số liệu thời gian thực!
 * 
 * Cách chạy:
 * 1. Chạy lệnh: node bridge/arduino-bridge.js
 * 2. Mở App trên Expo Go -> Vào màn hình "Cài Đặt" -> Nhập địa chỉ IP máy tính của bạn (VD: http://192.168.1.15:5000)
 */

const http = require('http');

const PORT = 5000;

// Trạng thái dữ liệu cảm biến mới nhất từ Arduino
let latestData = {
  water: 0,
  sound: 45,
  temp: 28.5,
  hum: 65.0,
  gate: false,
  lastUpdate: new Date().toISOString(),
};

let serialPort = null;

// Thử kết nối thư viện serialport nếu đã cài đặt
let isReconnecting = false;
async function initSerial() {
  if (serialPort && serialPort.isOpen) return;
  if (isReconnecting) return;
  isReconnecting = true;
  try {
    const { SerialPort } = require('serialport');
    const { ReadlineParser } = require('@serialport/parser-readline');

    // Tự động tìm cổng COM của Arduino
    const ports = await SerialPort.list();
    let targetPort = process.env.COM_PORT || 'COM5';

    // Nếu có cổng FTDI / Arduino / USB Serial
    const usbPort = ports.find(p => 
      p.path === 'COM5' ||
      (p.friendlyName && p.friendlyName.includes('USB Serial Port')) ||
      (p.manufacturer && (p.manufacturer.includes('FTDI') || p.manufacturer.toLowerCase().includes('arduino')))
    );

    if (usbPort) {
      targetPort = usbPort.path;
    }

    serialPort = new SerialPort({ path: targetPort, baudRate: 9600 }, (err) => {
      isReconnecting = false;
      if (err) {
        console.log(`⚠️ Chưa kết nối được ${targetPort} (${err.message}). Sẽ tự thử lại sau 2 giây...`);
        setTimeout(initSerial, 2000);
      } else {
        console.log(`✅ ĐÃ KẾT NỐI THÀNH CÔNG VỚI ARDUINO TẠI CỔNG ${targetPort}!`);
      }
    });

    if (serialPort) {
      serialPort.on('close', () => {
        console.log('⚠️ Cổng COM bị ngắt kết nối. Đang tự động kết nối lại...');
        setTimeout(initSerial, 2000);
      });
      serialPort.on('error', (e) => {});

      const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      parser.on('data', (line) => {
        try {
          const parsed = JSON.parse(line.trim());
          // Khử lỗi tràn bit nếu thư viện DHT trả về số 4278190105...
          if (parsed.temp !== undefined && Number(parsed.temp) > 100) {
            parsed.temp = Math.round(Number(parsed.temp) % 256);
          }
          if (parsed.hum !== undefined && Number(parsed.hum) > 100) {
            parsed.hum = Math.round(Number(parsed.hum) % 256);
          }

          latestData = { ...latestData, ...parsed, lastUpdate: new Date().toISOString() };
          const tempDisplay = parsed.dht_ok === false ? 'LỖI D2 (Kiểm tra chân)' : `${latestData.temp}°C`;
          console.log(`[Arduino Data]: Nước: ${latestData.water}% | Âm thanh: ${latestData.sound}dB | Đèn: ${latestData.light ? '💡SÁNG' : 'TẮT'} | Nhiệt độ: ${tempDisplay} | Cổng: ${latestData.gate ? 'MỞ' : 'ĐÓNG'}`);
        } catch (e) {
          // Bỏ qua các dòng text debug thông thường
        }
      });
    }
  } catch (err) {
    console.log(`ℹ️ Để đọc trực tiếp cổng USB từ Arduino, bạn có thể cài thêm thư viện:`);
    console.log(`   npm install serialport @serialport/parser-readline`);
  }
}

initSerial();

let appConnectedCount = 0;

// Khởi tạo HTTP Server phục vụ App di động
const server = http.createServer((req, res) => {
  // CORS Headers cho phép App Expo kết nối
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. App gọi lấy dữ liệu cảm biến: GET /api/sensors
  if (req.method === 'GET' && req.url === '/api/sensors') {
    if (appConnectedCount === 0) {
      console.log(`\n📱 >>> [ĐÃ KẾT NỐI]: Điện thoại iPhone vừa kết nối thành công với Bridge!`);
    }
    appConnectedCount++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(latestData));
    return;
  }

  // 2. Arduino / ESP32 gửi dữ liệu cảm biến lên: POST /api/sensors
  if (req.method === 'POST' && req.url === '/api/sensors') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        latestData = { ...latestData, ...incoming, lastUpdate: new Date().toISOString() };
        console.log(`[Cập nhật dữ liệu mới]:`, latestData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 3. App điều khiển đóng / mở cổng: POST /api/gate
  if (req.method === 'POST' && req.url === '/api/gate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const shouldOpen = payload.open === true || payload.action === 'OPEN';
        latestData.gate = shouldOpen;

        // Gửi lệnh xuống Arduino qua cáp USB
        if (serialPort && serialPort.isOpen) {
          const cmd = shouldOpen ? 'GATE_OPEN\n' : 'GATE_CLOSE\n';
          serialPort.write(cmd);
          console.log(`>>> Gửi lệnh xuống Arduino qua USB: ${cmd.trim()}`);
        }

        console.log(`>>> Lệnh từ App: ${shouldOpen ? 'MỞ CỔNG' : 'ĐÓNG CỔNG'}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, gate: shouldOpen }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // 4. App điều khiển bật / tắt đèn D5: POST /api/light
  if (req.method === 'POST' && req.url === '/api/light') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const shouldTurnOn = payload.light !== undefined ? payload.light : payload.on;
        latestData.light = shouldTurnOn;

        if (serialPort && serialPort.isOpen) {
          const cmd = shouldTurnOn ? 'LIGHT_ON\n' : 'LIGHT_OFF\n';
          serialPort.write(cmd);
          console.log(`>>> Gửi lệnh đèn xuống Arduino: ${cmd.trim()}`);
        }

        console.log(`>>> Lệnh từ App: ${shouldTurnOn ? 'BẬT ĐÈN D5' : 'TẮT ĐÈN D5'}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, light: shouldTurnOn }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ARDUINO BRIDGE SERVER ĐANG CHẠY TẠI PORT ${PORT}`);
  console.log(`👉 API lấy cảm biến: http://localhost:${PORT}/api/sensors`);
  console.log(`👉 API điều khiển cổng: http://localhost:${PORT}/api/gate`);
  console.log(`📱 Mở App Expo Go -> Cài đặt -> Bỏ tích Mô phỏng -> Nhập IP máy tính của bạn`);
  console.log(`======================================================\n`);
});
