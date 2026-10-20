import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function WaterSensorCard({ sensor }) {
  const { triggerSimulationEvent } = useIoT();
  if (!sensor) return null;

  const isLeak = sensor.value >= sensor.warningThreshold || sensor.isDetected;
  const isDanger = sensor.value >= sensor.dangerThreshold;

  return (
    <View style={[styles.card, isLeak && (isDanger ? styles.cardDanger : styles.cardWarning)]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: isLeak ? 'rgba(239, 68, 68, 0.2)' : 'rgba(2, 132, 199, 0.2)' }]}>
            <Ionicons
              name={isLeak ? 'warning' : 'water'}
              size={22}
              color={isLeak ? COLORS.danger : COLORS.water}
            />
          </View>
          <View>
            <Text style={styles.cardTitle}>{sensor.name}</Text>
            <Text style={styles.locationText}>{sensor.location}</Text>
          </View>
        </View>

        <View style={[styles.statusPill, isLeak ? (isDanger ? styles.pillDanger : styles.pillWarning) : styles.pillNormal]}>
          <Text style={[styles.statusText, isLeak ? (isDanger ? styles.textDanger : styles.textWarning) : styles.textNormal]}>
            {sensor.status || (isLeak ? 'PHÁT HIỆN NƯỚC' : 'KHÔ RÁO')}
          </Text>
        </View>
      </View>

      {/* Main Sensor Level */}
      <View style={styles.body}>
        <View style={styles.levelRow}>
          <View>
            <Text style={styles.valueLarge}>
              {sensor.value}
              <Text style={styles.unitText}> {sensor.unit}</Text>
            </Text>
            <Text style={styles.levelSubtext}>
              {isLeak ? '⚠️ Có nước tiếp xúc cực đoan' : '✅ Bề mặt khô ráo, an toàn'}
            </Text>
          </View>

          {/* Quick simulation trigger for demo */}
          <TouchableOpacity
            style={[styles.testBtn, isLeak ? styles.testBtnReset : styles.testBtnTrigger]}
            onPress={() => triggerSimulationEvent(isLeak ? 'water_clear' : 'water_leak')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLeak ? 'refresh' : 'flask-outline'}
              size={14}
              color={isLeak ? COLORS.textSecondary : COLORS.water}
            />
            <Text style={[styles.testBtnText, { color: isLeak ? COLORS.textSecondary : COLORS.water }]}>
              {isLeak ? 'Làm khô' : 'Test ngập'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Level Progress Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, Math.max(5, sensor.value))}%`,
                backgroundColor: isDanger ? COLORS.danger : isLeak ? COLORS.warning : COLORS.water,
              },
            ]}
          />
        </View>

        {/* Threshold Markers */}
        <View style={styles.thresholdInfo}>
          <Text style={styles.thresholdText}>Ngưỡng báo ẩm: {sensor.warningThreshold}%</Text>
          <Text style={styles.thresholdText}>Ngưỡng ngập: {sensor.dangerThreshold}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  cardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  cardDanger: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
  },
  pillNormal: {
    backgroundColor: COLORS.successMuted,
  },
  pillWarning: {
    backgroundColor: COLORS.warningMuted,
  },
  pillDanger: {
    backgroundColor: COLORS.dangerMuted,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textNormal: {
    color: COLORS.success,
  },
  textWarning: {
    color: COLORS.warning,
  },
  textDanger: {
    color: COLORS.danger,
  },
  body: {
    gap: 10,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  levelSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
  },
  testBtnTrigger: {
    borderColor: 'rgba(2, 132, 199, 0.4)',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  testBtnReset: {
    borderColor: COLORS.border,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
  },
  testBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  thresholdText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
