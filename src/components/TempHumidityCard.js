import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function TempHumidityCard({ tempSensor, humSensor }) {
  const { triggerSimulationEvent } = useIoT();

  const tempVal = tempSensor ? tempSensor.value : 28.5;
  const humVal = humSensor ? humSensor.value : 65;

  const isHighTemp = tempSensor && tempVal >= tempSensor.warningThreshold;
  const isDangerTemp = tempSensor && tempVal >= tempSensor.dangerThreshold;

  const isHighHum = humSensor && humVal >= humSensor.warningThreshold;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="thermometer" size={22} color={COLORS.temperature} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Nhiệt độ & Độ ẩm</Text>
            <Text style={styles.locationText}>Phòng khách (Cảm biến DHT11/22)</Text>
          </View>
        </View>

        {/* Quick simulation for heatwave */}
        <TouchableOpacity
          style={styles.testBtn}
          onPress={() => triggerSimulationEvent('high_temp')}
          activeOpacity={0.7}
        >
          <Ionicons name="flame-outline" size={14} color={COLORS.temperature} />
          <Text style={styles.testBtnText}>Test quá nhiệt</Text>
        </TouchableOpacity>
      </View>

      {/* Dual Gauges Row */}
      <View style={styles.gaugesRow}>
        {/* Temperature Box */}
        <View style={[styles.gaugeBox, isHighTemp && (isDangerTemp ? styles.gaugeBoxDanger : styles.gaugeBoxWarning)]}>
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeLabel}>Nhiệt độ</Text>
            <Ionicons
              name="sunny-outline"
              size={16}
              color={isHighTemp ? COLORS.danger : COLORS.temperature}
            />
          </View>

          <View style={styles.gaugeValueRow}>
            <Text style={[styles.gaugeValue, isDangerTemp && { color: COLORS.danger }]}>
              {tempVal}
            </Text>
            <Text style={styles.gaugeUnit}>°C</Text>
          </View>

          <View style={styles.miniBar}>
            <View
              style={[
                styles.miniBarFill,
                {
                  width: `${Math.min(100, Math.max(5, (tempVal / 50) * 100))}%`,
                  backgroundColor: isDangerTemp ? COLORS.danger : COLORS.temperature,
                },
              ]}
            />
          </View>

          <Text style={styles.gaugeStatus}>
            {tempSensor?.status || (isHighTemp ? 'Hơi nóng' : 'Mát mẻ')}
          </Text>
        </View>

        {/* Humidity Box */}
        <View style={[styles.gaugeBox, isHighHum && styles.gaugeBoxWarning]}>
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeLabel}>Độ ẩm không khí</Text>
            <Ionicons name="water-outline" size={16} color={COLORS.humidity} />
          </View>

          <View style={styles.gaugeValueRow}>
            <Text style={styles.gaugeValue}>{humVal}</Text>
            <Text style={styles.gaugeUnit}>%</Text>
          </View>

          <View style={styles.miniBar}>
            <View
              style={[
                styles.miniBarFill,
                {
                  width: `${Math.min(100, Math.max(5, humVal))}%`,
                  backgroundColor: COLORS.humidity,
                },
              ]}
            />
          </View>

          <Text style={styles.gaugeStatus}>
            {humSensor?.status || 'Thoải mái'}
          </Text>
        </View>
      </View>

      {/* Comfort Index Summary */}
      <View style={styles.summaryBar}>
        <Ionicons name="leaf-outline" size={15} color={COLORS.success} />
        <Text style={styles.summaryText}>
          Chỉ số tiện nghi: {tempVal > 32 ? 'Nóng bức, nên bật điều hòa' : tempVal < 22 ? 'Hơi se lạnh' : 'Nhiệt độ & độ ẩm rất lý tưởng'}
        </Text>
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  testBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.temperature,
  },
  gaugesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gaugeBox: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: SIZES.radiusMd,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
  },
  gaugeBoxWarning: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  gaugeBoxDanger: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gaugeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  gaugeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  gaugeValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  gaugeUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 3,
  },
  miniBar: {
    height: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  gaugeStatus: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SIZES.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
