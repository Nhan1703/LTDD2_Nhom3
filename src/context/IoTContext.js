import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_SENSORS, INITIAL_GATE_STATE, SENSOR_TYPES } from '../constants/initialSensors';
import { StorageService } from '../services/storageService';
import { simulateSensorStep } from '../services/simulationService';

const IoTContext = createContext(null);

export const IoTProvider = ({ children }) => {
  // Danh sách các cảm biến phần cứng thực tế (Nhiệt độ & Độ ẩm DHT11)
  const [sensors, setSensors] = useState(INITIAL_SENSORS);
  // Trạng thái kiểm soát cổng ra vào (Động cơ Servo SG90 & Thẻ RFID RC522)
  const [gateState, setGateState] = useState(INITIAL_GATE_STATE);
  // Danh sách nhật ký cảnh báo và thông báo hệ thống
  const [alerts, setAlerts] = useState([
    {
      id: 'alert_initial',
      title: 'Hệ thống khởi động',
      message: 'Các cảm biến phần cứng ESP32 đã sẵn sàng thu thập dữ liệu.',
      type: 'info',
      time: '08:00',
      date: 'Hôm nay',
    },
  ]);
  // Chế độ mô phỏng khi không có phần cứng
  const [isSimulating, setIsSimulating] = useState(false);
  // Trạng thái kết nối với phần cứng ESP32
  const [isHardwareConnected, setIsHardwareConnected] = useState(false);
  // Nguồn kết nối đang hoạt động (Wi-Fi LAN hoặc Firebase Cloud)
  const [connectionSource, setConnectionSource] = useState('Chờ thiết bị');
  // Trạng thái bật/tắt của đèn LED chiếu sáng (GPIO 2)
  const [isLightOn, setIsLightOn] = useState(false);
  // Thông tin quẹt thẻ RFID RC522 gần nhất
  const [rfidInfo, setRfidInfo] = useState({
    lastUid: '',
    masterUid: '620F0307',
    lastScanTime: '',
    isValid: false,
  });
  // Cấu hình mạng: Kết nối Firebase Cloud và Web Server ESP32 LAN (Đã loại bỏ hoàn toàn MQTT)
  const [networkConfig, setNetworkConfig] = useState({
    hardwareServerUrl: 'http://192.168.1.6:5000',
    isConnected: false,
    useFirebase: true,
    firebaseUrl: 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app',
  });

  const autoCloseTimerRef = useRef(null);

  // Tải trạng thái đã lưu trữ từ bộ nhớ LocalStorage trên trình duyệt / điện thoại khi mở ứng dụng
  useEffect(() => {
    async function loadData() {
      const savedSensors = await StorageService.getSensors();
      if (savedSensors && Array.isArray(savedSensors) && savedSensors.length > 0) {
        // Tự động lọc bỏ các cảm biến ảo không kết nối phần cứng (nước, âm thanh) từ phiên lưu trữ cũ
        const cleanSensors = savedSensors.filter(
          s => s.id !== 'sensor_water' && s.id !== 'sensor_sound'
        );
        if (cleanSensors.length > 0) {
          setSensors(cleanSensors);
        } else {
          setSensors(INITIAL_SENSORS);
        }
      } else {
        setSensors(INITIAL_SENSORS);
      }

      const savedGate = await StorageService.getGateState();
      if (savedGate) {
        setGateState(savedGate);
      }
      const savedAlerts = await StorageService.getAlerts();
      if (savedAlerts && Array.isArray(savedAlerts)) {
        setAlerts(savedAlerts);
      }
      const savedSettings = await StorageService.getSettings();
      if (savedSettings) {
        if (!savedSettings.hardwareServerUrl || savedSettings.hardwareServerUrl.includes('192.168.1.100')) {
          savedSettings.hardwareServerUrl = 'http://192.168.1.6:5000';
        }
        if (!savedSettings.firebaseUrl || savedSettings.firebaseUrl.includes('smart-iot-group3') || !savedSettings.firebaseUrl.includes('ltdd-945a5')) {
          savedSettings.firebaseUrl = 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app';
        }
        savedSettings.useFirebase = true;
        setNetworkConfig(prev => ({ ...prev, ...savedSettings, useFirebase: true }));
      }
    }
    loadData();
  }, []);

  // Lưu trạng thái cảm biến vào bộ nhớ (Debounce 2000ms để tránh ghi đĩa liên tục gây lag giao diện)
  useEffect(() => {
    const timer = setTimeout(() => {
      StorageService.saveSensors(sensors);
    }, 2000);
    return () => clearTimeout(timer);
  }, [sensors]);

  // Lưu trạng thái cổng vào bộ nhớ (Debounce 1000ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      StorageService.saveGateState(gateState);
    }, 1000);
    return () => clearTimeout(timer);
  }, [gateState]);

  // Lưu lịch sử thông báo vào bộ nhớ (Debounce 1500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      StorageService.saveAlerts(alerts);
    }, 1500);
    return () => clearTimeout(timer);
  }, [alerts]);

  // Vòng lặp mô phỏng sinh dữ liệu khi bật chế độ Simulation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSensors(prevSensors => {
        const nextSensors = simulateSensorStep(prevSensors);
        nextSensors.forEach(sensor => {
          if (sensor.value >= sensor.dangerThreshold && sensor.type !== SENSOR_TYPES.GATE) {
            checkAndPushAlert(sensor, 'danger');
          }
        });
        return nextSensors;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Vòng lặp cập nhật dữ liệu phần cứng: Tối ưu mượt mà không lag với Firebase Cloud & LAN HTTP
  useEffect(() => {
    if (isSimulating) {
      setIsHardwareConnected(false);
      return;
    }

    let rawUrl = networkConfig.hardwareServerUrl || 'http://192.168.1.6:5000';
    let url = rawUrl.replace('192.168.1.100', '192.168.1.6');
    if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
      url = 'http://localhost:5000';
    }

    const fbUrl = (networkConfig.firebaseUrl || 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app').replace(/\/+$/, '');
    const isHttpsWeb = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';

    let isFetching = false;
    const interval = setInterval(async () => {
      if (isFetching) return;
      isFetching = true;

      try {
        let data = null;
        let activeSource = '';

        // 1. Nếu không phải HTTPS Web (ví dụ Mobile Expo Go hoặc localhost), thử LAN HTTP trước
        if (!isHttpsWeb && url) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 600);
            const response = await fetch(`${url}/api/sensors`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
              data = await response.json();
              activeSource = 'Wi-Fi LAN';
            }
          } catch (err) {}
        }

        // 2. Đọc trực tiếp từ Firebase Realtime Database (Ưu tiên số 1 cho Web Vercel)
        if (!data && fbUrl) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const response = await fetch(`${fbUrl}/smart_home/telemetry.json`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
              const fbData = await response.json();
              if (fbData && typeof fbData === 'object' && (fbData.temp !== undefined || fbData.gate !== undefined || fbData.rfid !== undefined)) {
                data = fbData;
                activeSource = 'Firebase Cloud';
              }
            }

            // Dự phòng: Nếu node /smart_home/telemetry chưa có, đọc thử /smart_home.json
            if (!data) {
              const c2 = new AbortController();
              const t2 = setTimeout(() => c2.abort(), 2000);
              const r2 = await fetch(`${fbUrl}/smart_home.json`, { signal: c2.signal });
              clearTimeout(t2);
              if (r2.ok) {
                const rootData = await r2.json();
                if (rootData && typeof rootData === 'object') {
                  const candidate = rootData.telemetry || rootData;
                  if (candidate && (candidate.temp !== undefined || candidate.gate !== undefined)) {
                    data = candidate;
                    activeSource = 'Firebase Cloud';
                  }
                }
              }
            }
          } catch (err) {}
        }

        if (data) {
          setIsHardwareConnected(true);
          if (activeSource) setConnectionSource(activeSource);
          if (data.light !== undefined) setIsLightOn(Boolean(data.light));

          // Cập nhật thông tin thẻ RFID vừa quẹt
          if (data.rfid && String(data.rfid).trim().length > 0) {
            setRfidInfo(prev => {
              const cleanUid = String(data.rfid).toUpperCase().trim();
              if (prev.lastUid !== cleanUid) {
                const isValid = cleanUid === '620F0307' || cleanUid === '239A6C06' || cleanUid === (data.master || '').toUpperCase();
                return {
                  lastUid: cleanUid,
                  masterUid: data.master || '620F0307',
                  lastScanTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  isValid,
                };
              }
              return prev;
            });
          }

          // Cập nhật giá trị đo thực tế cho các cảm biến phần cứng (Nhiệt độ & Độ ẩm DHT11)
          // Áp dụng thuật toán so sánh (Diffing) để CHỈ render khi có thay đổi thật sự -> Khắc phục triệt để giật lag
          setSensors(prevSensors => {
            let hasChanged = false;
            const nextSensors = prevSensors.map(s => {
              let val = s.value;
              let status = s.status;

              if (s.type === SENSOR_TYPES.TEMPERATURE && data.temp !== undefined) {
                val = Number(data.temp);
                status = val >= s.dangerThreshold ? 'Quá nhiệt!' : val >= s.warningThreshold ? 'Hơi nóng' : 'Mát mẻ';
              } else if (s.type === SENSOR_TYPES.HUMIDITY && data.hum !== undefined) {
                val = Number(data.hum);
                status = val >= s.dangerThreshold ? 'Quá ẩm' : val >= s.warningThreshold ? 'Khá ẩm' : 'Thoải mái';
              }

              // Chỉ cập nhật object khi giá trị hoặc trạng thái thực sự thay đổi
              if (val !== s.value || status !== s.status) {
                hasChanged = true;
                const currentHistory = s.history || [];
                const updatedHistory = [...currentHistory.slice(-9), val];

                const updatedSensor = {
                  ...s,
                  value: val,
                  status,
                  history: updatedHistory,
                };

                if (val >= s.dangerThreshold) {
                  checkAndPushAlert(updatedSensor, 'danger');
                }

                return updatedSensor;
              }
              return s;
            });

            // Nếu không có thay đổi, trả về nguyên con trỏ mảng cũ để React không tốn CPU render lại
            return hasChanged ? nextSensors : prevSensors;
          });

          // Đồng bộ trạng thái cổng đóng/mở từ ESP32 / Firebase
          if (data.gate !== undefined) {
            setGateState(prev => (prev.isOpen !== Boolean(data.gate) ? { ...prev, isOpen: Boolean(data.gate) } : prev));
          }
        } else {
          setIsHardwareConnected(false);
        }
      } finally {
        isFetching = false;
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating, networkConfig.hardwareServerUrl, networkConfig.firebaseUrl, networkConfig.useFirebase]);

  // Điều khiển BẬT / TẮT đèn LED D2 từ App / Web
  const toggleLight = async () => {
    const nextState = !isLightOn;

    // Cập nhật giao diện ngay lập tức không có độ trễ
    setIsLightOn(nextState);

    // 1. Gửi lệnh tới Firebase Realtime Database tức thì (/smart_home/commands.json)
    try {
      const fbUrl = (networkConfig.firebaseUrl || 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app').replace(/\/+$/, '');
      if (fbUrl) {
        fetch(`${fbUrl}/smart_home/commands.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ light: nextState }),
        }).catch(err => console.log('Firebase light command error:', err));
      }
    } catch (e) {}

    // 2. Gửi lệnh song song tới Local Web Server ESP32 qua mạng LAN (chỉ khi không chạy trên HTTPS Web để không bị trễ)
    const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    if (!isHttps) {
      try {
        let targetUrl = networkConfig.hardwareServerUrl || 'http://192.168.1.6:5000';
        if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
          targetUrl = 'http://localhost:5000';
        } else {
          targetUrl = targetUrl.replace('192.168.1.100', '192.168.1.6');
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 400);
        fetch(`${targetUrl}/api/light`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ light: nextState, on: nextState }),
          signal: controller.signal,
        })
          .then(() => clearTimeout(timeoutId))
          .catch(() => clearTimeout(timeoutId));
      } catch (e) {}
    }
  };

  // Hàm tạo cảnh báo không trùng lặp
  const lastAlertTimes = useRef({});
  const checkAndPushAlert = (sensor, severity) => {
    const now = Date.now();
    const lastTime = lastAlertTimes.current[sensor.id] || 0;
    if (now - lastTime < 20000) return;
    lastAlertTimes.current[sensor.id] = now;

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newAlert = {
      id: `alert_${Date.now()}_${Math.random()}`,
      title: `Cảnh báo: ${sensor.name}`,
      message: `Chỉ số đạt mức ${sensor.value} ${sensor.unit} (${sensor.status})! Vượt mức nguy hiểm ${sensor.dangerThreshold} ${sensor.unit}.`,
      type: severity,
      time: timeStr,
      date: 'Vừa xong',
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);
  };

  // Điều khiển ĐÓNG / MỞ CỔNG từ App / Web
  const toggleGate = (method = 'Điều khiển qua Web / App') => {
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const willBeOpen = !gateState.isOpen;

    const newLog = {
      id: `log_${Date.now()}`,
      action: willBeOpen ? 'Mở cổng' : 'Đóng cổng',
      method: method,
      time: nowStr,
      date: 'Hôm nay',
      status: 'success',
    };

    // Tự động đóng cổng nếu cài đặt chế độ Auto-Close
    if (willBeOpen && gateState.mode === 'Auto-Close' && gateState.autoCloseDelaySec > 0) {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = setTimeout(() => {
        const isHttpsEnv = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';

        // Gửi lệnh đóng cổng qua LAN nếu không phải HTTPS Web
        if (!isHttpsEnv) {
          try {
            let targetUrl = networkConfig.hardwareServerUrl || 'http://192.168.1.6:5000';
            if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
              targetUrl = 'http://localhost:5000';
            } else {
              targetUrl = targetUrl.replace('192.168.1.100', '192.168.1.6');
            }
            fetch(`${targetUrl}/api/gate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                open: false,
                action: 'CLOSE',
                method: `Tự động đóng (${gateState.autoCloseDelaySec}s)`,
              }),
            }).catch(err => console.log('Auto close hardware send error:', err));
          } catch (e) {}
        }

        // Gửi lệnh đóng cổng lên Firebase Cloud
        try {
          const fbUrl = (networkConfig.firebaseUrl || 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app').replace(/\/+$/, '');
          if (fbUrl) {
            fetch(`${fbUrl}/smart_home/commands.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gate: false }),
            }).catch(err => console.log('Firebase auto-close error:', err));
          }
        } catch (e) {}

        // Cập nhật giao diện
        setGateState(current => ({
          ...current,
          isOpen: false,
          lastActionTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          logs: [
            {
              id: `log_${Date.now()}`,
              action: 'Đóng cổng',
              method: `Tự động đóng (${gateState.autoCloseDelaySec}s)`,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              date: 'Hôm nay',
              status: 'success',
            },
            ...current.logs,
          ],
        }));
      }, gateState.autoCloseDelaySec * 1000);
    } else {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    }

    setGateState(prev => ({
      ...prev,
      isOpen: willBeOpen,
      lastActionTime: nowStr,
      logs: [newLog, ...prev.logs.slice(0, 49)],
    }));

    // 1. Gửi lệnh điều khiển cổng lên Firebase Realtime Database tức thì (/smart_home/commands.json)
    try {
      const fbUrl = (networkConfig.firebaseUrl || 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app').replace(/\/+$/, '');
      if (fbUrl) {
        fetch(`${fbUrl}/smart_home/commands.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gate: willBeOpen }),
        }).catch(err => console.log('Firebase gate command error:', err));

        // Tự động giải phóng lệnh sau 2 giây để tránh kẹt trạng thái trên Cloud gây lặp vô tận
        setTimeout(() => {
          fetch(`${fbUrl}/smart_home/commands.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gate: null }),
          }).catch(() => {});
        }, 2000);
      }
    } catch (e) {}

    // 2. Gửi lệnh song song tới Local Web Server ESP32 qua mạng LAN (chỉ khi không chạy trên HTTPS Web để không bị trễ)
    const isHttpsWebContext = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    if (!isHttpsWebContext) {
      try {
        let targetUrl = networkConfig.hardwareServerUrl || 'http://192.168.1.6:5000';
        if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
          targetUrl = 'http://localhost:5000';
        } else {
          targetUrl = targetUrl.replace('192.168.1.100', '192.168.1.6');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 400);
        fetch(`${targetUrl}/api/gate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            open: willBeOpen,
            action: willBeOpen ? 'OPEN' : 'CLOSE',
            method,
          }),
          signal: controller.signal,
        })
          .then(() => clearTimeout(timeoutId))
          .catch(() => clearTimeout(timeoutId));
      } catch (e) {}
    }

    // Tạo thông báo lịch sử cổng
    const newAlert = {
      id: `alert_gate_${Date.now()}`,
      title: willBeOpen ? 'Cổng đã được mở' : 'Cổng đã khóa an toàn',
      message: `Cổng ra vào được ${willBeOpen ? 'MỞ' : 'ĐÓNG'} bởi: ${method}`,
      type: willBeOpen ? 'warning' : 'info',
      time: nowStr,
      date: 'Vừa xong',
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const updateGateMode = (mode, delaySec = 10) => {
    setGateState(prev => ({
      ...prev,
      mode,
      autoCloseDelaySec: delaySec,
    }));
  };

  // Thêm cảm biến tùy chỉnh mở rộng
  const addSensor = (sensorData) => {
    const newSensor = {
      id: `sensor_${Date.now()}`,
      type: sensorData.type || SENSOR_TYPES.CUSTOM,
      name: sensorData.name || 'Cảm biến mới',
      location: sensorData.location || 'Khu vực chưa đặt tên',
      unit: sensorData.unit || '',
      value: sensorData.min || 0,
      min: Number(sensorData.min) || 0,
      max: Number(sensorData.max) || 100,
      warningThreshold: Number(sensorData.warningThreshold) || 70,
      dangerThreshold: Number(sensorData.dangerThreshold) || 90,
      icon: sensorData.icon || 'hardware-chip-outline',
      color: sensorData.color || '#3B82F6',
      status: 'Bình thường',
      history: [sensorData.min || 0],
      isCustom: true,
      description: sensorData.description || '',
    };

    setSensors(prev => [...prev, newSensor]);

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAlerts(prev => [
      {
        id: `alert_add_${Date.now()}`,
        title: 'Đã thêm cảm biến mới',
        message: `Đã kết nối thành công: ${newSensor.name} (${newSensor.location})`,
        type: 'info',
        time: timeStr,
        date: 'Vừa xong',
      },
      ...prev,
    ]);
  };

  // Xóa cảm biến
  const removeSensor = (sensorId) => {
    setSensors(prev => prev.filter(s => s.id !== sensorId));
  };

  // Cập nhật ngưỡng báo động của cảm biến
  const updateSensorThresholds = (sensorId, warningThreshold, dangerThreshold) => {
    setSensors(prev =>
      prev.map(s => {
        if (s.id === sensorId) {
          return {
            ...s,
            warningThreshold: Number(warningThreshold),
            dangerThreshold: Number(dangerThreshold),
          };
        }
        return s;
      })
    );
  };

  // Kích hoạt biến cố mô phỏng kiểm thử
  const triggerSimulationEvent = (eventType) => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (eventType === 'high_temp') {
      setSensors(prev =>
        prev.map(s => (s.type === SENSOR_TYPES.TEMPERATURE ? { ...s, value: 39.5, status: 'Nhiệt độ quá cao!' } : s))
      );
      setAlerts(prev => [
        {
          id: `alert_sim_${Date.now()}`,
          title: '🔥 CẢNH BÁO: Quá nhiệt môi trường!',
          message: 'Nhiệt độ đạt mức 39.5°C, có khả năng hỏa hoạn hoặc phòng quá nóng.',
          type: 'danger',
          time: timeStr,
          date: 'Vừa xong',
        },
        ...prev,
      ]);
    }
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Lưu cấu hình cài đặt mạng
  const updateSettings = (newConfig) => {
    setNetworkConfig(prev => {
      const merged = { ...prev, ...newConfig };
      StorageService.saveSettings(merged);
      return merged;
    });
  };

  // Khôi phục mặc định ban đầu
  const resetToDefaults = async () => {
    setSensors(INITIAL_SENSORS);
    setGateState(INITIAL_GATE_STATE);
    await StorageService.clearAll();
  };

  return (
    <IoTContext.Provider
      value={{
        sensors,
        gateState,
        alerts,
        isSimulating,
        setIsSimulating,
        isHardwareConnected,
        connectionSource,
        isLightOn,
        rfidInfo,
        networkConfig,
        mqttConfig: networkConfig, // Giữ tương thích ngược
        toggleGate,
        toggleLight,
        updateGateMode,
        addSensor,
        removeSensor,
        updateSensorThresholds,
        triggerSimulationEvent,
        clearAlerts,
        dismissAlert,
        updateSettings,
        resetToDefaults,
      }}
    >
      {children}
    </IoTContext.Provider>
  );
};

export const useIoT = () => {
  const context = useContext(IoTContext);
  if (!context) {
    throw new Error('useIoT must be used within an IoTProvider');
  }
  return context;
};
