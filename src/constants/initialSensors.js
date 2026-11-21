export const SENSOR_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  GATE: 'gate',
  LIGHT: 'light',
  GAS: 'gas',
  MOTION: 'motion',
  SOIL: 'soil',
  SMOKE: 'smoke',
  CUSTOM: 'custom',
};

// Cấu hình mẫu mở rộng thêm cảm biến trong tương lai nếu gắn thêm vào ESP32
export const SENSOR_PRESETS = [
  {
    type: SENSOR_TYPES.GAS,
    name: 'Cảm biến Khí Gas (MQ-2)',
    unit: 'ppm',
    min: 0,
    max: 1000,
    warningThreshold: 300,
    dangerThreshold: 500,
    icon: 'flame',
    color: '#F97316',
    description: 'Phát hiện khí gas, khói, khí rò rỉ',
  },
  {
    type: SENSOR_TYPES.LIGHT,
    name: 'Cảm biến Ánh sáng (LDR)',
    unit: 'lux',
    min: 0,
    max: 1000,
    warningThreshold: 100,
    dangerThreshold: 50,
    icon: 'sunny',
    color: '#EAB308',
    description: 'Đo cường độ ánh sáng môi trường',
  },
  {
    type: SENSOR_TYPES.MOTION,
    name: 'Cảm biến Chuyển động (PIR)',
    unit: 'status',
    min: 0,
    max: 1,
    warningThreshold: 1,
    dangerThreshold: 1,
    icon: 'walk',
    color: '#EC4899',
    description: 'Phát hiện người di chuyển trong vùng quét',
  },
  {
    type: SENSOR_TYPES.CUSTOM,
    name: 'Cảm biến Tùy chọn',
    unit: 'đơn vị',
    min: 0,
    max: 100,
    warningThreshold: 70,
    dangerThreshold: 90,
    icon: 'hardware-chip-outline',
    color: '#3B82F6',
    description: 'Tự cấu hình cảm biến bất kỳ',
  },
];

// Danh sách các cảm biến THỰC TẾ đang kết nối vật lý với bo mạch ESP32
// Chỉ bao gồm: Nhiệt độ DHT11 & Độ ẩm không khí DHT11
// (Đã loại bỏ cảm biến Nước và cảm biến Âm thanh vì không cắm phần cứng)
export const INITIAL_SENSORS = [
  {
    id: 'sensor_temp',
    type: SENSOR_TYPES.TEMPERATURE,
    name: 'Nhiệt độ Môi trường',
    location: 'Phòng khách (DHT11)',
    unit: '°C',
    value: 26.2,
    min: 0,
    max: 60,
    warningThreshold: 34,
    dangerThreshold: 38,
    icon: 'thermometer',
    color: '#EF4444',
    status: 'Mát mẻ',
    history: [26.0, 26.1, 26.2, 26.2, 26.3, 26.2, 26.2, 26.2],
    isCustom: false,
  },
  {
    id: 'sensor_humidity',
    type: SENSOR_TYPES.HUMIDITY,
    name: 'Độ ẩm Không khí',
    location: 'Phòng khách (DHT11)',
    unit: '%',
    value: 87,
    min: 0,
    max: 100,
    warningThreshold: 90,
    dangerThreshold: 95,
    icon: 'cloudy',
    color: '#06B6D4',
    status: 'Bình thường',
    history: [85, 86, 86, 87, 87, 88, 87, 87],
    isCustom: false,
  },
];

// Trạng thái khởi tạo Cổng ra vào (Servo SG90 & Đầu đọc RFID RC522)
export const INITIAL_GATE_STATE = {
  isOpen: false, // false = Đóng (Khóa), true = Mở
  lastActionTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  mode: 'Manual', // Manual | Auto-Close
  autoCloseDelaySec: 10,
  logs: [
    {
      id: 'log_1',
      action: 'Đóng cổng',
      method: 'Tự động đóng',
      time: '08:15:30',
      date: 'Hôm nay',
      status: 'success',
    },
    {
      id: 'log_2',
      action: 'Mở cổng',
      method: 'Điều khiển qua App / Web',
      time: '08:14:45',
      date: 'Hôm nay',
      status: 'success',
    },
    {
      id: 'log_3',
      action: 'Mở cổng',
      method: 'Thẻ từ RFID',
      time: '07:30:10',
      date: 'Hôm nay',
      status: 'success',
    },
  ],
};
