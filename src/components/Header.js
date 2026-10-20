import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function Header({ title, subtitle, onOpenAddModal, onOpenAlerts, onOpenSettings }) {
  const { isSimulating, setIsSimulating, isHardwareConnected, alerts } = useIoT();
  const unreadAlerts = alerts.filter(a => a.type === 'danger' || a.type === 'warning').length;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.subtitle}>{subtitle || 'LTDD - NHÓM 3'}</Text>
          <Text style={styles.title}>{title || 'IoT Smart Home'}</Text>
        </View>

        <View style={styles.actionsRow}>
          {/* Simulation Toggle Badge */}
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
              {isSimulating ? 'Mô phỏng' : (isHardwareConnected ? 'Arduino LIVE' : 'Chờ thiết bị')}
            </Text>
          </TouchableOpacity>

          {/* Add Sensor Button */}
          {onOpenAddModal && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onOpenAddModal}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onOpenSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
          )}

          {/* Notification Bell */}
          {onOpenAlerts && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onOpenAlerts}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
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
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: COLORS.background,
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
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
    letterSpacing: 1.2,
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
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeActive: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  badgeConnected: {
    borderColor: COLORS.successMuted,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeInactive: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
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
    borderColor: COLORS.background,
  },
  alertBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
