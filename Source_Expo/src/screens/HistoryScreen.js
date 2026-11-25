import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function HistoryScreen() {
  const { sensors, gateState, rfidInfo } = useIoT();

  // Tìm 2 cảm biến chính từ bo mạch ESP32
  const tempSensor = sensors.find(s => s.type === 'temperature') || sensors[0];
  const humSensor = sensors.find(s => s.type === 'humidity') || sensors[1];

  // Chuyển đổi xem biểu đồ chi tiết giữa Nhiệt độ và Độ ẩm
  const [activeChart, setActiveChart] = useState('temp'); // 'temp' | 'hum'

  const currentSensor = activeChart === 'temp' ? tempSensor : humSensor;
  const history = currentSensor?.history && currentSensor.history.length > 0 ? currentSensor.history : [25, 25, 25];

  // Thống kê nhanh nhiệt độ
  const tempHistory = tempSensor?.history || [tempSensor?.value || 25];
  const tempMax = Math.max(...tempHistory);
  const tempMin = Math.min(...tempHistory);
  const tempAvg = (tempHistory.reduce((a, b) => a + b, 0) / tempHistory.length).toFixed(1);

  // Thống kê nhanh độ ẩm
  const humHistory = humSensor?.history || [humSensor?.value || 80];
  const humMax = Math.max(...humHistory);
  const humMin = Math.min(...humHistory);
  const humAvg = (humHistory.reduce((a, b) => a + b, 0) / humHistory.length).toFixed(0);

  // Tính toán dải vẽ biểu đồ dốc động
  const minVal = Math.min(...history);
  const maxVal = Math.max(...history);
  const delta = maxVal - minVal;
  const chartMin = minVal - (delta > 0 ? delta * 0.25 : 1);
  const chartMax = maxVal + (delta > 0 ? delta * 0.25 : 1);
  const chartRange = (chartMax - chartMin) || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.responsiveWrapper}>
        {/* Header tinh gọn không chữ dư thừa */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Thống Kê</Text>
        </View>

        {/* ========================================================================= */}
        {/* KHỐI HIỂN THỊ CHUNG NHIỆT ĐỘ & ĐỘ ẨM (HIỆN DIỆN SONG SONG CẠNH NHAU) */}
        {/* ========================================================================= */}
        <View style={styles.twinCard}>
          {/* Cột 1: Nhiệt độ phòng */}
          <TouchableOpacity
            style={[styles.sensorCol, activeChart === 'temp' && styles.sensorColActiveTemp]}
            onPress={() => setActiveChart('temp')}
            activeOpacity={0.8}
          >
            <View style={styles.colHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="thermometer" size={20} color="#EF4444" />
              </View>
              <Text style={styles.colLabel}>Nhiệt độ</Text>
            </View>

            <Text style={styles.colValueLarge}>
              {tempSensor?.value || '--'}
              <Text style={styles.colUnit}> °C</Text>
            </Text>

            <View style={styles.miniStatsRow}>
              <Text style={styles.miniStatText}>Cao: {tempMax}°</Text>
              <Text style={styles.miniStatDot}>•</Text>
              <Text style={styles.miniStatText}>Thấp: {tempMin}°</Text>
              <Text style={styles.miniStatDot}>•</Text>
              <Text style={styles.miniStatText}>TB: {tempAvg}°</Text>
            </View>
          </TouchableOpacity>

          {/* Vạch ngăn cách giữa 2 cột */}
          <View style={styles.colDivider} />

          {/* Cột 2: Độ ẩm không khí */}
          <TouchableOpacity
            style={[styles.sensorCol, activeChart === 'hum' && styles.sensorColActiveHum]}
            onPress={() => setActiveChart('hum')}
            activeOpacity={0.8}
          >
            <View style={styles.colHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="water" size={20} color="#06B6D4" />
              </View>
              <Text style={styles.colLabel}>Độ ẩm</Text>
            </View>

            <Text style={[styles.colValueLarge, { color: '#0284C7' }]}>
              {humSensor?.value || '--'}
              <Text style={styles.colUnit}> %</Text>
            </Text>

            <View style={styles.miniStatsRow}>
              <Text style={styles.miniStatText}>Cao: {humMax}%</Text>
              <Text style={styles.miniStatDot}>•</Text>
              <Text style={styles.miniStatText}>Thấp: {humMin}%</Text>
              <Text style={styles.miniStatDot}>•</Text>
              <Text style={styles.miniStatText}>TB: {humAvg}%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* BIỂU ĐỒ BIẾN THIÊN 10 LẦN ĐO GẦN NHẤT */}
        {/* ========================================================================= */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>
              Lịch sử 10 lần đo gần nhất ({activeChart === 'temp' ? 'Nhiệt độ °C' : 'Độ ẩm %'})
            </Text>

            {/* Nút chuyển nhanh giữa 2 biểu đồ */}
            <View style={styles.chartToggleGroup}>
              <TouchableOpacity
                style={[styles.toggleBtn, activeChart === 'temp' && styles.toggleBtnActive]}
                onPress={() => setActiveChart('temp')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleBtnText, activeChart === 'temp' && styles.toggleBtnTextActive]}>
                  Nhiệt độ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, activeChart === 'hum' && styles.toggleBtnActive]}
                onPress={() => setActiveChart('hum')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleBtnText, activeChart === 'hum' && styles.toggleBtnTextActive]}>
                  Độ ẩm
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Vẽ biểu đồ cột */}
          <View style={styles.chartArea}>
            {history.map((val, idx) => {
              const heightPercent = Math.min(100, Math.max(18, ((val - chartMin) / chartRange) * 100));
              const isLatest = idx === history.length - 1;
              const barColor = activeChart === 'temp' ? '#EF4444' : '#06B6D4';

              return (
                <View key={idx} style={styles.barCol}>
                  <Text style={[styles.barValText, isLatest && { color: barColor, fontWeight: '800' }]}>
                    {val}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: isLatest ? barColor : '#CBD5E1',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barIdxText, isLatest && { color: barColor, fontWeight: '800' }]}>
                    {isLatest ? 'Hiện tại' : `-${history.length - 1 - idx}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* KHỐI AN NINH CỔNG & THẺ TỪ RFID GỌN GÀNG */}
        {/* ========================================================================= */}
        <View style={styles.gateSummaryCard}>
          <View style={styles.gateRow}>
            <View style={styles.gateLeft}>
              <View style={[styles.iconCircle, { backgroundColor: gateState.isOpen ? '#FEF3C7' : '#DCFCE7' }]}>
                <Ionicons
                  name={gateState.isOpen ? 'lock-open' : 'lock-closed'}
                  size={20}
                  color={gateState.isOpen ? COLORS.warning : COLORS.success}
                />
              </View>
              <View>
                <Text style={styles.gateTitle}>Cổng ra vào</Text>
                <Text style={[styles.gateStatus, { color: gateState.isOpen ? COLORS.warning : COLORS.success }]}>
                  {gateState.isOpen ? 'Đang mở' : 'Đang khóa an toàn'}
                </Text>
              </View>
            </View>

            <View style={styles.rfidRight}>
              <Text style={styles.rfidLabel}>Thẻ vừa quét:</Text>
              <Text style={styles.rfidUid}>{rfidInfo?.lastUid || 'Chưa có'}</Text>
              <Text style={styles.rfidTime}>{rfidInfo?.lastScanTime || 'Vừa xong'}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Nền xám tuyết hiện đại #F8FAFC
  },
  content: {
    paddingHorizontal: SIZES.lg,
    paddingTop: 16,
    paddingBottom: 48,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  header: {
    marginBottom: SIZES.md,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  twinCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  sensorCol: {
    flex: 1,
    padding: SIZES.sm,
    borderRadius: SIZES.radiusMd,
  },
  sensorColActiveTemp: {
    backgroundColor: '#FEF2F2',
  },
  sensorColActiveHum: {
    backgroundColor: '#F0F9FF',
  },
  colDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  colValueLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  colUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  miniStatText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  miniStatDot: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  chartCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    flexWrap: 'wrap',
    gap: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chartToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: SIZES.radiusSm,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingTop: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barValText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barIdxText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  gateSummaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  gateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  gateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  gateStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  rfidRight: {
    alignItems: 'flex-end',
  },
  rfidLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  rfidUid: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  rfidTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
