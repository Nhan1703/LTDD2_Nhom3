import { SENSOR_TYPES } from '../constants/initialSensors';

/**
 * Generates realistic minor fluctuations for real-time simulation
 */
export function simulateSensorStep(sensors) {
  return sensors.map(sensor => {
    let newVal = sensor.value;
    let newStatus = sensor.status;
    let isDetected = sensor.isDetected;

    switch (sensor.type) {
      case SENSOR_TYPES.TEMPERATURE: {
        // Temperature varies slowly by +/- 0.2°C
        const delta = (Math.random() - 0.5) * 0.4;
        newVal = Math.round((newVal + delta) * 10) / 10;
        // Keep within 24 to 36 in normal simulation
        newVal = Math.max(22, Math.min(38, newVal));

        if (newVal >= sensor.dangerThreshold) {
          newStatus = 'Quá nhiệt!';
        } else if (newVal >= sensor.warningThreshold) {
          newStatus = 'Hơi nóng';
        } else if (newVal < 25) {
          newStatus = 'Mát mẻ';
        } else {
          newStatus = 'Dễ chịu';
        }
        break;
      }

      case SENSOR_TYPES.HUMIDITY: {
        // Humidity varies by +/- 1%
        const delta = Math.floor((Math.random() - 0.5) * 3);
        newVal = Math.max(45, Math.min(85, newVal + delta));

        if (newVal >= sensor.dangerThreshold) {
          newStatus = 'Độ ẩm quá cao';
        } else if (newVal >= sensor.warningThreshold) {
          newStatus = 'Khá ẩm';
        } else if (newVal < 50) {
          newStatus = 'Khô ráo';
        } else {
          newStatus = 'Lý tưởng';
        }
        break;
      }

      case SENSOR_TYPES.SOUND: {
        // Sound dB has occasional spikes (e.g. people talking)
        const isSpike = Math.random() < 0.15;
        if (isSpike) {
          newVal = Math.floor(65 + Math.random() * 25); // 65-90 dB
        } else {
          const delta = (Math.random() - 0.5) * 6;
          newVal = Math.round(newVal + delta);
          newVal = Math.max(35, Math.min(65, newVal));
        }

        if (newVal >= sensor.dangerThreshold) {
          newStatus = 'Báo động ồn!';
        } else if (newVal >= sensor.warningThreshold) {
          newStatus = 'Ồn ào';
        } else if (newVal < 50) {
          newStatus = 'Yên tĩnh';
        } else {
          newStatus = 'Bình thường';
        }
        break;
      }

      case SENSOR_TYPES.WATER: {
        // Water is usually 0 unless triggered
        if (sensor.value > 0) {
          // If water is currently present, slight variance or drying up slowly
          const delta = (Math.random() - 0.5) * 4;
          newVal = Math.max(0, Math.min(100, Math.round(newVal + delta)));
        }
        isDetected = newVal > 5;
        if (newVal >= sensor.dangerThreshold) {
          newStatus = 'Báo động ngập!';
        } else if (newVal >= sensor.warningThreshold) {
          newStatus = 'Có nước ẩm';
        } else {
          newStatus = 'Khô ráo an toàn';
        }
        break;
      }

      case SENSOR_TYPES.GAS: {
        const delta = (Math.random() - 0.5) * 8;
        newVal = Math.max(sensor.min, Math.min(sensor.max, Math.round(newVal + delta)));
        if (newVal >= sensor.dangerThreshold) newStatus = 'Khí rò rỉ nguy hiểm!';
        else if (newVal >= sensor.warningThreshold) newStatus = 'Cảnh báo nồng độ';
        else newStatus = 'An toàn';
        break;
      }

      case SENSOR_TYPES.LIGHT: {
        const delta = (Math.random() - 0.5) * 20;
        newVal = Math.max(sensor.min, Math.min(sensor.max, Math.round(newVal + delta)));
        if (newVal < sensor.dangerThreshold) newStatus = 'Rất tối';
        else if (newVal < sensor.warningThreshold) newStatus = 'Ánh sáng yếu';
        else newStatus = 'Đủ sáng';
        break;
      }

      case SENSOR_TYPES.SOIL: {
        const delta = (Math.random() - 0.5) * 2;
        newVal = Math.max(sensor.min, Math.min(sensor.max, Math.round(newVal + delta)));
        if (newVal < sensor.dangerThreshold) newStatus = 'Đất khô cằn - Cần tưới';
        else if (newVal < sensor.warningThreshold) newStatus = 'Độ ẩm thấp';
        else newStatus = 'Đất đủ ẩm';
        break;
      }

      default: {
        const range = (sensor.max - sensor.min) || 100;
        const delta = (Math.random() - 0.5) * (range * 0.05);
        newVal = Math.max(sensor.min, Math.min(sensor.max, Math.round((newVal + delta) * 10) / 10));
        if (newVal >= sensor.dangerThreshold) newStatus = 'Vượt ngưỡng!';
        else if (newVal >= sensor.warningThreshold) newStatus = 'Cảnh báo';
        else newStatus = 'Bình thường';
        break;
      }
    }

    // Keep history of last 10 points for mini charts
    const currentHistory = sensor.history || [];
    const updatedHistory = [...currentHistory.slice(-9), newVal];

    return {
      ...sensor,
      value: newVal,
      status: newStatus,
      isDetected,
      history: updatedHistory,
    };
  });
}
