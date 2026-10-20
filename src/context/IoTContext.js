import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_SENSORS, INITIAL_GATE_STATE, SENSOR_TYPES } from '../constants/initialSensors';
import { StorageService } from '../services/storageService';
import { simulateSensorStep } from '../services/simulationService';

const IoTContext = createContext(null);

export const IoTProvider = ({ children }) => {
  const [sensors, setSensors] = useState(INITIAL_SENSORS);
  const [gateState, setGateState] = useState(INITIAL_GATE_STATE);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert_initial',
      title: 'Hệ thống khởi động',
      message: 'Các cảm biến đã sẵn sàng thu thập dữ liệu.',
      type: 'info',
      time: '08:00',
      date: 'Hôm nay',
    },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isHardwareConnected, setIsHardwareConnected] = useState(false);
  const [mqttConfig, setMqttConfig] = useState({
    hardwareServerUrl: 'http://192.168.1.6:5000',
    brokerUrl: 'broker.emqx.io',
    port: '1883',
    topicPrefix: 'smart_home_group3',
    isConnected: false,
    useFirebase: false,
    firebaseUrl: 'https://smart-iot-group3-default-rtdb.firebaseio.com',
  });

  const autoCloseTimerRef = useRef(null);

  // Load persisted state on mount
  useEffect(() => {
    async function loadData() {
      const savedSensors = await StorageService.getSensors();
      if (savedSensors && Array.isArray(savedSensors) && savedSensors.length > 0) {
        setSensors(savedSensors);
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
        setMqttConfig(prev => ({ ...prev, ...savedSettings }));
      }
    }
    loadData();
  }, []);

  // Save sensors on update
  useEffect(() => {
    StorageService.saveSensors(sensors);
  }, [sensors]);

  // Save gate on update
  useEffect(() => {
    StorageService.saveGateState(gateState);
  }, [gateState]);

  // Save alerts on update
  useEffect(() => {
    StorageService.saveAlerts(alerts);
  }, [alerts]);

  // Simulation timer loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSensors(prevSensors => {
        const nextSensors = simulateSensorStep(prevSensors);
        // Check for threshold alerts
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

  // Real Hardware Polling loop when simulation is OFF (Reading from Arduino / ESP32)
  useEffect(() => {
    if (isSimulating) {
      setIsHardwareConnected(false);
      return;
    }

    let rawUrl = mqttConfig.hardwareServerUrl || 'http://192.168.1.6:5000';
    let url = rawUrl.replace('192.168.1.100', '192.168.1.6');
    if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
      url = 'http://localhost:5000';
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${url}/api/sensors`);
        if (response.ok) {
          const data = await response.json();
          setIsHardwareConnected(true);
          setSensors(prevSensors => {
            return prevSensors.map(s => {
              let val = s.value;
              let status = s.status;
              let isDetected = s.isDetected;

              if (s.type === SENSOR_TYPES.WATER && data.water !== undefined) {
                val = Number(data.water);
                isDetected = val > 5;
                status = val >= s.dangerThreshold ? 'Báo động ngập!' : val >= s.warningThreshold ? 'Có nước ẩm' : 'Khô ráo an toàn';
              } else if (s.type === SENSOR_TYPES.SOUND && data.sound !== undefined) {
                val = Number(data.sound);
                status = val >= s.dangerThreshold ? 'Báo động ồn!' : val >= s.warningThreshold ? 'Ồn ào' : 'Bình thường';
              } else if (s.type === SENSOR_TYPES.TEMPERATURE && data.temp !== undefined) {
                val = Number(data.temp);
                status = val >= s.dangerThreshold ? 'Quá nhiệt!' : val >= s.warningThreshold ? 'Hơi nóng' : 'Mát mẻ';
              } else if (s.type === SENSOR_TYPES.HUMIDITY && data.hum !== undefined) {
                val = Number(data.hum);
                status = val >= s.dangerThreshold ? 'Quá ẩm' : val >= s.warningThreshold ? 'Khá ẩm' : 'Thoải mái';
              }

              const currentHistory = s.history || [];
              const updatedHistory = [...currentHistory.slice(-9), val];

              const updatedSensor = {
                ...s,
                value: val,
                status,
                isDetected: s.type === SENSOR_TYPES.SOUND ? Boolean(data.light) : isDetected,
                isLightOn: Boolean(data.light),
                history: updatedHistory,
              };

              if (val >= s.dangerThreshold) {
                checkAndPushAlert(updatedSensor, 'danger');
              }

              return updatedSensor;
            });
          });

          // Sync gate state if reported by Arduino
          if (data.gate !== undefined) {
            setGateState(prev => (prev.isOpen !== Boolean(data.gate) ? { ...prev, isOpen: Boolean(data.gate) } : prev));
          }
        } else {
          setIsHardwareConnected(false);
        }
      } catch (err) {
        setIsHardwareConnected(false);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isSimulating, mqttConfig.hardwareServerUrl]);

  // Điều khiển BẬT / TẮT đèn LED D5 từ App
  const toggleLight = async () => {
    const currentSoundSensor = sensors.find(s => s.type === SENSOR_TYPES.SOUND);
    const nextState = !currentSoundSensor?.isLightOn;

    try {
      let targetUrl = mqttConfig.hardwareServerUrl || 'http://192.168.1.6:5000';
      if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
        targetUrl = 'http://localhost:5000';
      } else {
        targetUrl = targetUrl.replace('192.168.1.100', '192.168.1.6');
      }
      fetch(`${targetUrl}/api/light`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ light: nextState, on: nextState }),
      }).catch(err => console.log('Light hardware send error:', err));
    } catch (e) {}

    setSensors(prev =>
      prev.map(s => (s.type === SENSOR_TYPES.SOUND ? { ...s, isLightOn: nextState } : s))
    );
  };

  // Helper to trigger alert without duplicating spam
  const lastAlertTimes = useRef({});
  const checkAndPushAlert = (sensor, severity) => {
    const now = Date.now();
    const lastTime = lastAlertTimes.current[sensor.id] || 0;
    // Debounce alerts to once per 20 seconds per sensor
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

  // Toggle Gate function
  const toggleGate = (method = 'Điều khiển qua App') => {
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

    // If opening and autoClose is configured
    if (willBeOpen && gateState.mode === 'Auto-Close' && gateState.autoCloseDelaySec > 0) {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = setTimeout(() => {
        // Gửi lệnh đóng cổng xuống phần cứng Arduino thật
        try {
          let targetUrl = mqttConfig.hardwareServerUrl || 'http://192.168.1.6:5000';
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

        // Cập nhật giao diện App
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

    // Always send command to physical Arduino / Hardware Bridge
    try {
      let targetUrl = mqttConfig.hardwareServerUrl || 'http://192.168.1.6:5000';
      if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
        targetUrl = 'http://localhost:5000';
      } else {
        targetUrl = targetUrl.replace('192.168.1.100', '192.168.1.6');
      }

      fetch(`${targetUrl}/api/gate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          open: willBeOpen,
          action: willBeOpen ? 'OPEN' : 'CLOSE',
          method,
        }),
      }).catch(err => {
        console.log('Cannot send gate command to hardware:', err.message);
      });
    } catch (e) {}

    // Add alert
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

  // Add custom sensor dynamically (Future expansion!)
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

    // Push alert
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

  // Remove sensor
  const removeSensor = (sensorId) => {
    setSensors(prev => prev.filter(s => s.id !== sensorId));
  };

  // Update sensor threshold
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

  // Trigger test events for presentation demo
  const triggerSimulationEvent = (eventType) => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (eventType === 'water_leak') {
      setSensors(prev =>
        prev.map(s => (s.type === SENSOR_TYPES.WATER ? { ...s, value: 78, isDetected: true, status: 'Báo động rò rỉ nước!' } : s))
      );
      setAlerts(prev => [
        {
          id: `alert_sim_${Date.now()}`,
          title: '🚨 NGUY HIỂM: Rò rỉ nước!',
          message: 'Cảm biến nước phát hiện ngập nước ở mức 78%! Cần kiểm tra van nước ngay lập tức.',
          type: 'danger',
          time: timeStr,
          date: 'Vừa xong',
        },
        ...prev,
      ]);
    } else if (eventType === 'water_clear') {
      setSensors(prev =>
        prev.map(s => (s.type === SENSOR_TYPES.WATER ? { ...s, value: 0, isDetected: false, status: 'Khô ráo an toàn' } : s))
      );
    } else if (eventType === 'loud_sound') {
      setSensors(prev =>
        prev.map(s => (s.type === SENSOR_TYPES.SOUND ? { ...s, value: 92, status: 'Báo động âm thanh lớn!' } : s))
      );
      setAlerts(prev => [
        {
          id: `alert_sim_${Date.now()}`,
          title: '🔊 BÁO ĐỘNG: Tiếng ồn bất thường!',
          message: 'Cường độ âm thanh đạt 92 dB! Nghi ngờ có kính vỡ, đột nhập hoặc tiếng động lớn.',
          type: 'danger',
          time: timeStr,
          date: 'Vừa xong',
        },
        ...prev,
      ]);
    } else if (eventType === 'high_temp') {
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

  const updateSettings = (newConfig) => {
    setMqttConfig(prev => {
      const merged = { ...prev, ...newConfig };
      StorageService.saveSettings(merged);
      return merged;
    });
  };

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
        mqttConfig,
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
