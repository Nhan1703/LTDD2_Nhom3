import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function GateControlCard({ onNavigateToGate }) {
  // Lấy trạng thái cổng và hàm điều khiển từ IoT Context
  const { gateState, toggleGate } = useIoT();
  const isOpen = gateState.isOpen;

  return (
    <View style={[styles.card, isOpen ? styles.cardOpen : styles.cardClosed]}>
      {/* Phần đầu Card: Tiêu đề, icon trạng thái và badge */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          {/* Vòng tròn icon trạng thái khóa/mở kích thước gọn gàng */}
          <View style={[styles.iconHalo, { backgroundColor: isOpen ? '#FEF3C7' : '#DCFCE7' }]}>
            <View style={[styles.iconCircle, { backgroundColor: isOpen ? '#FDE68A' : '#BBF7D0' }]}>
              <Ionicons
                name={isOpen ? 'lock-open' : 'lock-closed'}
                size={18}
                color={isOpen ? '#B45309' : '#047857'}
              />
            </View>
          </View>

          <View style={styles.titleTextGroup}>
            <Text style={styles.cardTitle}>Cổng ra vào</Text>
            <Text style={styles.lastActionText}>
              Cập nhật: {gateState.lastActionTime || 'Vừa xong'}
            </Text>
          </View>
        </View>

        {/* Badge trạng thái khóa/mở */}
        <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
          <View style={[styles.badgeDot, { backgroundColor: isOpen ? COLORS.warning : COLORS.success }]} />
          <Text style={[styles.badgeText, isOpen ? styles.badgeTextOpen : styles.badgeTextClosed]}>
            {isOpen ? 'ĐANG MỞ' : 'ĐÃ KHÓA'}
          </Text>
        </View>
      </View>

      {/* Nội dung chi tiết cổng */}
      <View style={styles.body}>
        {/* Khung 2 cột hiển thị chế độ và cảm biến an toàn */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Chế độ vận hành</Text>
            <Text style={styles.infoValue}>
              {gateState.mode === 'Auto-Close' ? `Tự đóng (${gateState.autoCloseDelaySec}s)` : 'Thủ công (App)'}
            </Text>
          </View>

          <View style={styles.infoColDivider} />

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Cảm biến an toàn</Text>
            <Text style={[styles.infoValue, { color: COLORS.success }]}>
              Sẵn sàng 100%
            </Text>
          </View>
        </View>

        {/* Nút bấm chuyển đổi Mở / Khóa Cổng tinh gọn */}
        <TouchableOpacity
          style={[styles.actionBtn, isOpen ? styles.actionBtnClose : styles.actionBtnOpen]}
          onPress={() => toggleGate('Điều khiển từ Bảng tổng quan')}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isOpen ? 'lock-closed' : 'key'}
            size={18}
            color={COLORS.white}
          />
          <Text style={styles.actionBtnText}>
            {isOpen ? 'Khóa cổng ngay' : 'Mở cổng ra vào'}
          </Text>
        </TouchableOpacity>

        {/* Đường dẫn mở trang chi tiết cổng */}
        {onNavigateToGate && (
          <TouchableOpacity
            style={styles.detailLink}
            onPress={onNavigateToGate}
            activeOpacity={0.7}
          >
            <Text style={styles.detailLinkText}>Xem nhật ký & cài đặt cổng</Text>
            <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
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
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    marginBottom: 10,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconHalo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextGroup: {
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  lastActionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    gap: 4,
    borderWidth: 1,
  },
  badgeOpen: {
    backgroundColor: COLORS.warningMuted,
    borderColor: COLORS.warningBorder,
  },
  badgeClosed: {
    backgroundColor: COLORS.successMuted,
    borderColor: COLORS.successBorder,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  badgeTextOpen: {
    color: COLORS.warning,
  },
  badgeTextClosed: {
    color: COLORS.success,
  },
  body: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardSubtle,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  infoColDivider: {
    width: 1,
    height: 22,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
    gap: 6,
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
    fontSize: 14,
    fontWeight: '700',
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1,
    gap: 4,
  },
  detailLinkText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
