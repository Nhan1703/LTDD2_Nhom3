import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function GateControlCard({ onNavigateToGate }) {
  const { gateState, toggleGate } = useIoT();
  const isOpen = gateState.isOpen;

  return (
    <View style={[styles.card, isOpen ? styles.cardOpen : styles.cardClosed]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <View style={[styles.iconCircle, { backgroundColor: isOpen ? COLORS.warningMuted : COLORS.primaryMuted }]}>
            <Ionicons
              name={isOpen ? 'lock-open' : 'lock-closed'}
              size={24}
              color={isOpen ? COLORS.warning : COLORS.primary}
            />
          </View>
          <View>
            <Text style={styles.cardTitle}>Cổng ra vào</Text>
            <Text style={styles.lastActionText}>Cập nhật: {gateState.lastActionTime || 'Vừa xong'}</Text>
          </View>
        </View>

        {/* State Badge */}
        <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
          <Text style={[styles.badgeText, isOpen ? styles.badgeTextOpen : styles.badgeTextClosed]}>
            {isOpen ? 'ĐANG MỞ' : 'ĐÃ KHÓA'}
          </Text>
        </View>
      </View>

      {/* Main Gate Visual / Info */}
      <View style={styles.body}>
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Chế độ vận hành</Text>
            <Text style={styles.infoValue}>
              {gateState.mode === 'Auto-Close' ? `Tự đóng (${gateState.autoCloseDelaySec}s)` : 'Thủ công (App)'}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Cảm biến an toàn</Text>
            <Text style={[styles.infoValue, { color: COLORS.success }]}>Sẵn sàng 100%</Text>
          </View>
        </View>

        {/* Toggle Button */}
        <TouchableOpacity
          style={[styles.actionBtn, isOpen ? styles.actionBtnClose : styles.actionBtnOpen]}
          onPress={() => toggleGate('Điều khiển qua App')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isOpen ? 'close-circle-outline' : 'key-outline'}
            size={22}
            color={COLORS.white}
          />
          <Text style={styles.actionBtnText}>
            {isOpen ? 'Đóng cổng ngay' : 'Mở cổng ra vào'}
          </Text>
        </TouchableOpacity>

        {onNavigateToGate && (
          <TouchableOpacity
            style={styles.detailLink}
            onPress={onNavigateToGate}
            activeOpacity={0.7}
          >
            <Text style={styles.detailLinkText}>Xem nhật ký & cài đặt cổng</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
          </TouchableOpacity>
        )}
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
  cardOpen: {
    borderColor: COLORS.warningBorder,
  },
  cardClosed: {
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  lastActionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SIZES.radiusSm,
  },
  badgeOpen: {
    backgroundColor: COLORS.warningMuted,
  },
  badgeClosed: {
    backgroundColor: COLORS.successMuted,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextOpen: {
    color: COLORS.warning,
  },
  badgeTextClosed: {
    color: COLORS.success,
  },
  body: {
    gap: SIZES.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.radiusMd,
    gap: 8,
    ...SHADOWS.small,
  },
  actionBtnOpen: {
    backgroundColor: COLORS.primary,
  },
  actionBtnClose: {
    backgroundColor: COLORS.danger,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    gap: 4,
  },
  detailLinkText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
