import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function SoundSensorCard({ sensor }) {
  const { triggerSimulationEvent, toggleLight } = useIoT();
  if (!sensor) return null;

  const value = Math.round(sensor.value);
  const isLoud = value >= sensor.warningThreshold;
  const isAlarm = value >= sensor.dangerThreshold;

  // Segmented equalizer levels (10 bars)
  const totalBars = 10;
  const activeBars = Math.min(totalBars, Math.max(1, Math.round((value / 120) * totalBars)));

  return (
    <View style={[styles.card, isLoud && (isAlarm ? styles.cardDanger : styles.cardWarning)]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: isAlarm ? '#FEE2E2' : '#FEF3C7' }]}>
            <Ionicons
              name={isAlarm ? 'volume-high' : 'volume-medium'}
              size={22}
              color={isAlarm ? COLORS.danger : COLORS.sound}
            />
          </View>
          <View>
            <Text style={styles.cardTitle}>{sensor.name}</Text>
            <Text style={styles.locationText}>{sensor.location}</Text>
          </View>
        </View>

        <View style={[styles.statusPill, isAlarm ? styles.pillDanger : isLoud ? styles.pillWarning : styles.pillNormal]}>
          <Text style={[styles.statusText, isAlarm ? styles.textDanger : isLoud ? styles.textWarning : styles.textNormal]}>
            {sensor.status || (isAlarm ? 'BÁO ĐỘNG ỒN' : isLoud ? 'ỒN ÀO' : 'BÌNH THƯỜNG')}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.valueRow}>
          <View>
            <Text style={styles.valueLarge}>
              {value}
              <Text style={styles.unitText}> dB</Text>
            </Text>
            <Text style={styles.levelSubtext}>
              {isAlarm ? '🚨 Cảnh báo âm thanh quá lớn!' : isLoud ? '⚠️ Mức độ tiếng ồn cao' : 'Môi trường êm ái, thích hợp học tập & nghỉ ngơi'}
            </Text>
          </View>

          {/* Quick simulation trigger */}
          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => triggerSimulationEvent('loud_sound')}
            activeOpacity={0.7}
          >
            <Ionicons name="megaphone-outline" size={14} color={COLORS.sound} />
            <Text style={styles.testBtnText}>Test tiếng nổ</Text>
          </TouchableOpacity>
        </View>

        {/* Equalizer Visualizer Bars */}
        <View style={styles.eqContainer}>
          {Array.from({ length: totalBars }).map((_, index) => {
            const isActive = index < activeBars;
            let barColor = COLORS.success;
            if (index >= 7) barColor = COLORS.danger;
            else if (index >= 5) barColor = COLORS.warning;

            return (
              <View
                key={index}
                style={[
                  styles.eqBar,
                  {
                    height: 12 + index * 2.5,
                    backgroundColor: isActive ? barColor : '#E2E8F0',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Threshold indicators */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Ngưỡng ồn: {sensor.warningThreshold} dB</Text>
          <Text style={styles.footerText}>Ngưỡng báo động: {sensor.dangerThreshold} dB</Text>
        </View>

        {/* Light status indicator & manual toggle */}
        <TouchableOpacity
          style={[styles.lightBadge, sensor.isLightOn ? styles.lightOnBadge : styles.lightOffBadge]}
          onPress={toggleLight}
          activeOpacity={0.7}
        >
          <Ionicons
            name={sensor.isLightOn ? "bulb" : "bulb-outline"}
            size={18}
            color={sensor.isLightOn ? COLORS.warning : COLORS.textTertiary}
          />
          <Text style={[styles.lightBadgeText, sensor.isLightOn && styles.lightOnText]}>
            {sensor.isLightOn ? '💡 Đèn D5: ĐANG BẬT SÁNG' : '💡 Đèn D5: Đang tắt (Tự bật khi ồn)'}
          </Text>
          <View style={[styles.togglePill, sensor.isLightOn ? styles.togglePillActive : styles.togglePillInactive]}>
            <Text style={[styles.togglePillText, sensor.isLightOn && styles.togglePillTextActive]}>
              {sensor.isLightOn ? 'ĐANG BẬT' : 'BẬT THỬ'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg, // Nền trắng sáng
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  cardWarning: {
    borderColor: 'rgba(217, 119, 6, 0.4)',
    backgroundColor: '#FFFBEB',
  },
  cardDanger: {
    borderColor: 'rgba(220, 38, 38, 0.4)',
    backgroundColor: '#FEF2F2',
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
    fontSize: 12,
    color: COLORS.textSecondary,
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
    gap: 12,
  },
  valueRow: {
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
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  levelSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    maxWidth: 220,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.sound,
  },
  eqContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 38,
    paddingHorizontal: 6,
    backgroundColor: '#F8FAFC', // Nền equalizer sáng nhã nhặn
    borderRadius: SIZES.radiusSm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eqBar: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  lightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusSm,
    marginTop: 10,
    borderWidth: 1,
  },
  lightOnBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  lightOffBadge: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  lightBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  lightOnText: {
    color: COLORS.warning,
  },
  togglePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  togglePillActive: {
    backgroundColor: COLORS.warning,
  },
  togglePillInactive: {
    backgroundColor: '#E2E8F0',
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
});
