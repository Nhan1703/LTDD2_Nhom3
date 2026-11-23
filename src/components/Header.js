import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function Header({ title, subtitle, onOpenAddModal, onOpenAlerts, onOpenSettings }) {
  const { isSimulating, setIsSimulating, isHardwareConnected, connectionSource, alerts } = useIoT();
  const unreadAlerts = alerts.filter(a => a.type === 'danger' || a.type === 'warning').length;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.subtitle}>{subtitle || 'LTDD - NHÓM 3'}</Text>
          <Text style={styles.title}>{title || 'IoT Smart Home'}</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Status Badge */}
          <TouchableOpacity
            style={[
              styles.statusBadge,
              isSimulating ? styles.badgeActive : (isHardwareConnected ? styles.badgeConnected : styles.badgeInactive),
            ]}
            onPress={() => setIsSimulating(!isSimulating)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isSimulating ? COLORS.warning : (isHardwareConnected ? COLORS.success : COLORS.danger) },
              ]}
            />
            <Text style={styles.badgeText}>
              {isSimulating ? 'Mô phỏng' : (isHardwareConnected ? (connectionSource || 'ESP32 LIVE') : 'Chờ thiết bị')}
            </Text>
          </TouchableOpacity>

          {/* Add Sensor Button */}
          {onOpenAddModal && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onOpenAddModal}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onOpenSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}

          {/* Notification Bell */}
          {onOpenAlerts && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onOpenAlerts}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
              {unreadAlerts > 0 && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.lg,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.cardBgHover,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeActive: {
    borderColor: COLORS.warningBorder,
    backgroundColor: COLORS.warningMuted,
  },
  badgeConnected: {
    borderColor: COLORS.successBorder,
    backgroundColor: COLORS.successMuted,
  },
  badgeInactive: {
    borderColor: COLORS.dangerBorder,
    backgroundColor: COLORS.dangerMuted,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBgHover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.cardBg,
  },
  alertBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
