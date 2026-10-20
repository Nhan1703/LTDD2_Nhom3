import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function HistoryScreen() {
  const { sensors } = useIoT();
  const [selectedSensorId, setSelectedSensorId] = useState(sensors[0]?.id || '');

  const activeSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];
  const history = activeSensor?.history || [0];

  const maxVal = Math.max(...history);
  const minVal = Math.min(...history);
  const avgVal = (history.reduce((a, b) => a + b, 0) / (history.length || 1)).toFixed(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenSubtitle}>PHÂN TÍCH & BIỂU ĐỒ</Text>
        <Text style={styles.screenTitle}>Lịch Sử Dữ Liệu Cảm Biến</Text>
      </View>

      {/* Sensor Picker horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sensorTabs}>
        {sensors.map(sensor => {
          const isSelected = sensor.id === activeSensor?.id;
          return (
            <TouchableOpacity
              key={sensor.id}
              style={[
                styles.sensorTab,
                isSelected && { borderColor: sensor.color, backgroundColor: `${sensor.color}25` },
              ]}
              onPress={() => setSelectedSensorId(sensor.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={sensor.icon || 'hardware-chip-outline'}
                size={16}
                color={isSelected ? sensor.color : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.sensorTabText,
                  isSelected && { color: COLORS.white, fontWeight: '700' },
                ]}
              >
                {sensor.name.split(' (')[0].split(' &')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeSensor && (
        <>
          {/* Main Visual Graph Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>{activeSensor.name}</Text>
                <Text style={styles.chartSubtitle}>10 lần đo gần nhất theo thời gian thực</Text>
              </View>
              <View style={[styles.unitBadge, { backgroundColor: `${activeSensor.color}20` }]}>
                <Text style={[styles.unitBadgeText, { color: activeSensor.color }]}>
                  {activeSensor.value} {activeSensor.unit}
                </Text>
              </View>
            </View>

            {/* Custom Bar / Sparkline Chart */}
            <View style={styles.chartArea}>
              {history.map((val, idx) => {
                const range = (activeSensor.max - activeSensor.min) || 100;
                const heightPercent = Math.min(100, Math.max(12, ((val - activeSensor.min) / range) * 100));
                const isLatest = idx === history.length - 1;

                return (
                  <View key={idx} style={styles.barCol}>
                    <Text style={styles.barValueText}>{val}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: isLatest ? activeSensor.color : 'rgba(148, 163, 184, 0.4)',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barIdxText}>T-{history.length - idx}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="arrow-up" size={18} color={COLORS.danger} />
              <Text style={styles.statLabel}>Cao nhất</Text>
              <Text style={styles.statValue}>
                {maxVal} {activeSensor.unit}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="arrow-down" size={18} color={COLORS.success} />
              <Text style={styles.statLabel}>Thấp nhất</Text>
              <Text style={styles.statValue}>
                {minVal} {activeSensor.unit}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="analytics" size={18} color={COLORS.info} />
              <Text style={styles.statLabel}>Trung bình</Text>
              <Text style={styles.statValue}>
                {avgVal} {activeSensor.unit}
              </Text>
            </View>
          </View>

          {/* Sensor Info Summary */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Thông Tin Tham Số Cảm Biến</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Vị trí lắp đặt</Text>
              <Text style={styles.infoVal}>{activeSensor.location}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Ngưỡng cảnh báo (Vàng)</Text>
              <Text style={[styles.infoVal, { color: COLORS.warning }]}>
                {activeSensor.warningThreshold} {activeSensor.unit}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Ngưỡng báo động (Đỏ)</Text>
              <Text style={[styles.infoVal, { color: COLORS.danger }]}>
                {activeSensor.dangerThreshold} {activeSensor.unit}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Tần suất cập nhật</Text>
              <Text style={styles.infoVal}>Mỗi 3 giây (Thời gian thực)</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SIZES.lg,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    marginBottom: SIZES.md,
  },
  screenSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
    letterSpacing: 1.2,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  sensorTabs: {
    flexDirection: 'row',
    marginBottom: SIZES.lg,
  },
  sensorTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  sensorTabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
    ...SHADOWS.small,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.lg,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chartSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SIZES.radiusSm,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 20,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: '75%',
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barIdxText: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SIZES.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusMd,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  infoKey: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
