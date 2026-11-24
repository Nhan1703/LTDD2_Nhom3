import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function TempHumidityCard({ tempSensor, humSensor }) {
  // Giá trị thực tế từ cảm biến DHT11
  const tempVal = tempSensor ? tempSensor.value : 26.2;
  const humVal = humSensor ? humSensor.value : 89;

  // Kiểm tra ngưỡng cảnh báo nhiệt độ và độ ẩm
  const isHighTemp = tempSensor && tempVal >= (tempSensor.warningThreshold || 35);
  const isDangerTemp = tempSensor && tempVal >= (tempSensor.dangerThreshold || 40);
  const isHighHum = humSensor && humVal >= (humSensor.warningThreshold || 85);

  return (
    <View style={styles.card}>
      {/* Header Widget */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="thermometer" size={18} color="#E11D48" />
          </View>
          <View>
            <Text style={styles.widgetTitle}>Môi Trường Phòng Khách</Text>
            <Text style={styles.widgetSubtitle}>Cảm biến DHT11 • ESP32 GPIO 4</Text>
          </View>
        </View>

        {/* Huy hiệu thời gian thực */}
        <View style={styles.realtimePill}>
          <View style={styles.realtimeDot} />
          <Text style={styles.realtimeText}>Live</Text>
        </View>
      </View>

      {/* Thân widget: Hiển thị song song 2 chỉ số nguyên khối, không đóng khung vụn vặt */}
      <View style={styles.metricsContainer}>
        {/* Cột 1: Nhiệt độ */}
        <View style={styles.metricColumn}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="sunny" size={14} color="#E11D48" style={{ marginRight: 4 }} />
            <Text style={styles.metricLabel}>Nhiệt độ</Text>
          </View>

          <View style={styles.metricValueRow}>
            <Text style={[styles.metricBigNumber, { color: isDangerTemp ? COLORS.danger : '#E11D48' }]}>
              {tempVal}
            </Text>
            <Text style={styles.metricUnit}>°C</Text>
          </View>

          {/* Thanh đo mức nhiệt độ */}
          <View style={styles.gaugeTrack}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${Math.min(100, Math.max(10, (tempVal / 50) * 100))}%`,
                  backgroundColor: isDangerTemp ? COLORS.danger : '#E11D48',
                },
              ]}
            />
          </View>

          {/* Huy hiệu trạng thái nhiệt độ */}
          <View style={[styles.statusTag, { backgroundColor: '#FFE4E6' }]}>
            <Text style={[styles.statusTagText, { color: '#BE123C' }]}>
              {tempSensor?.status || (isDangerTemp ? 'Nguy hiểm' : isHighTemp ? 'Khá nóng' : 'Mát mẻ')}
            </Text>
          </View>
        </View>

        {/* Vạch chia đôi giữa 2 cột */}
        <View style={styles.columnDivider} />

        {/* Cột 2: Độ ẩm */}
        <View style={styles.metricColumn}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="water" size={14} color="#0284C7" style={{ marginRight: 4 }} />
            <Text style={styles.metricLabel}>Độ ẩm không khí</Text>
          </View>

          <View style={styles.metricValueRow}>
            <Text style={[styles.metricBigNumber, { color: '#0284C7' }]}>
              {humVal}
            </Text>
            <Text style={styles.metricUnit}>%</Text>
          </View>

          {/* Thanh đo mức độ ẩm */}
          <View style={[styles.gaugeTrack, { backgroundColor: '#E0F2FE' }]}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${Math.min(100, Math.max(10, humVal))}%`,
                  backgroundColor: '#0284C7',
                },
              ]}
            />
          </View>

          {/* Huy hiệu trạng thái độ ẩm */}
          <View style={[styles.statusTag, { backgroundColor: '#E0F2FE' }]}>
            <Text style={[styles.statusTagText, { color: '#0369A1' }]}>
              {humSensor?.status || (humVal > 80 ? 'Khá ẩm' : 'Lý tưởng')}
            </Text>
          </View>
        </View>
      </View>

      {/* Dải tiện nghi tinh tế ở đáy thẻ */}
      <View style={styles.comfortNotice}>
        <Ionicons name="leaf" size={14} color="#059669" />
        <Text style={styles.comfortNoticeText}>
          {tempVal > 32 ? 'Nóng bức • Nên bật điều hòa' : tempVal < 20 ? 'Hơi se lạnh • Nên giữ ấm' : 'Chỉ số tiện nghi: Nhiệt độ & độ ẩm rất lý tưởng'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  widgetSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  realtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  realtimeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.success,
  },
  realtimeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSubtle,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnDivider: {
    width: 1,
    height: 64,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  metricBigNumber: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 3,
  },
  gaugeTrack: {
    width: '80%',
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFEDD5',
    overflow: 'hidden',
    marginBottom: 8,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  comfortNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: SIZES.radiusSm,
  },
  comfortNoticeText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
    flex: 1,
  },
});
