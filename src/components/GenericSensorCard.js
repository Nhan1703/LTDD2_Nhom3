import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function GenericSensorCard({ sensor }) {
  const { removeSensor } = useIoT();
  if (!sensor) return null;

  const value = sensor.value;
  const isWarning = sensor.warningThreshold && value >= sensor.warningThreshold;
  const isDanger = sensor.dangerThreshold && value >= sensor.dangerThreshold;

  const percent = sensor.max > sensor.min
    ? Math.min(100, Math.max(0, ((value - sensor.min) / (sensor.max - sensor.min)) * 100))
    : 50;

  const confirmDelete = () => {
    Alert.alert(
      'Xóa cảm biến',
      `Bạn có chắc chắn muốn xóa cảm biến "${sensor.name}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => removeSensor(sensor.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.card, isWarning && (isDanger ? styles.cardDanger : styles.cardWarning)]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: `${sensor.color || COLORS.primary}25` }]}>
            <Ionicons
              name={sensor.icon || 'hardware-chip-outline'}
              size={22}
              color={sensor.color || COLORS.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{sensor.name}</Text>
            <Text style={styles.locationText}>{sensor.location || 'Khu vực tự do'}</Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          <View
            style={[
              styles.statusPill,
              isDanger ? styles.pillDanger : isWarning ? styles.pillWarning : styles.pillNormal,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isDanger ? styles.textDanger : isWarning ? styles.textWarning : styles.textNormal,
              ]}
            >
              {sensor.status || (isDanger ? 'NGUY HIỂM' : isWarning ? 'CẢNH BÁO' : 'BÌNH THƯỜNG')}
            </Text>
          </View>

          {sensor.isCustom && (
            <TouchableOpacity
              onPress={confirmDelete}
              style={styles.deleteBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.valueRow}>
          <Text style={styles.valueLarge}>
            {value}
            <Text style={styles.unitText}> {sensor.unit}</Text>
          </Text>
          <Text style={styles.rangeText}>
            Dải đo: {sensor.min} - {sensor.max} {sensor.unit}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percent}%`,
                backgroundColor: isDanger ? COLORS.danger : isWarning ? COLORS.warning : (sensor.color || COLORS.primary),
              },
            ]}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Ngưỡng cảnh báo: {sensor.warningThreshold} {sensor.unit}</Text>
          <Text style={styles.footerText}>Nguy hiểm: {sensor.dangerThreshold} {sensor.unit}</Text>
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
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  deleteBtn: {
    padding: 4,
  },
  body: {
    gap: 10,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  valueLarge: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  unitText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  rangeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  progressTrack: {
    height: 7,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
