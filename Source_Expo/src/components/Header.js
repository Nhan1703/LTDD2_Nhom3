import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function Header({ title, subtitle, onOpenAlerts, onOpenSettings }) {
  // Lấy trạng thái kết nối thực tế từ ngữ cảnh IoT
  const { isHardwareConnected, connectionSource, alerts } = useIoT();

  // Đếm số lượng thông báo nguy hiểm hoặc cảnh báo chưa xem
  const unreadAlerts = alerts.filter(a => a.type === 'danger' || a.type === 'warning').length;

  return (
    <View style={styles.container}>
      {/* Khung giới hạn độ rộng để thẳng hàng chuẩn với nội dung ở giữa trên màn hình Web PC */}
      <View style={styles.innerContainer}>
        {/* Cụm Tiêu Đề bên trái: Lời chào/Thương hiệu + Tiêu đề trang to rõ */}
        <View style={styles.titleColumn}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle || 'HỆ THỐNG IOT • NHÓM 3'}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Bảng Điều Khiển'}
          </Text>
        </View>

        {/* Cụm Tiện Ích bên phải: Huy hiệu kết nối Cloud + Nút Chuông + Nút Cài đặt */}
        <View style={styles.actionsCluster}>
          {/* Badge trạng thái kết nối phần cứng Cloud tinh gọn */}
          <View
            style={[
              styles.connectionBadge,
              isHardwareConnected ? styles.badgeConnected : styles.badgeDisconnected,
            ]}
          >
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: isHardwareConnected ? COLORS.success : COLORS.danger },
              ]}
            />
            <Text style={styles.connectionText} numberOfLines={1}>
              {isHardwareConnected ? (connectionSource || 'Firebase') : 'Chờ thiết bị'}
            </Text>
          </View>

          {/* Nút Chuông cảnh báo có huy hiệu đếm */}
          {onOpenAlerts && (
            <TouchableOpacity
              style={styles.circleButton}
              onPress={onOpenAlerts}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={18} color={COLORS.textPrimary} />
              {unreadAlerts > 0 && (
                <View style={styles.alertDotBadge}>
                  <Text style={styles.alertDotText}>
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Nút Cài đặt nhanh */}
          {onOpenSettings && (
            <TouchableOpacity
              style={styles.circleButton}
              onPress={onOpenSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={17} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingTop: 10,
    paddingBottom: 14,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  badgeConnected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeDisconnected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  circleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  alertDotBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.cardBg,
  },
  alertDotText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
