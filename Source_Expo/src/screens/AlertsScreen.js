import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function AlertsScreen() {
  const { alerts, clearAlerts, dismissAlert, triggerSimulationEvent } = useIoT();
  const [filter, setFilter] = useState('all'); // all | danger | warning | info

  // Thống kê số lượng từng loại thông báo
  const dangerCount = alerts.filter(a => a.type === 'danger').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const infoCount = alerts.filter(a => a.type === 'info').length;

  // Lọc thông báo theo danh mục
  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.type === filter;
  });

  // Hộp thoại xác nhận xóa tất cả thông báo
  const confirmClearAll = () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông báo không?') : true;
      if (ok) {
        clearAlerts();
      }
    } else {
      Alert.alert(
        'Xóa thông báo',
        'Bạn có chắc chắn muốn xóa toàn bộ danh sách thông báo không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xóa sạch', style: 'destructive', onPress: clearAlerts },
        ]
      );
    }
  };

  // Dọn dẹp nhanh các thông báo đóng/mở cổng bình thường
  const clearGateLogsOnly = () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Dọn dẹp các thông báo đóng/mở cổng thông thường?') : true;
      if (ok) {
        alerts.forEach(a => {
          if (a.id.startsWith('alert_gate_')) {
            dismissAlert(a.id);
          }
        });
      }
    } else {
      Alert.alert(
        'Dọn thông báo cổng',
        'Dọn dẹp các thông báo đóng/mở cổng thông thường?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Dọn dẹp',
            onPress: () => {
              alerts.forEach(a => {
                if (a.id.startsWith('alert_gate_')) {
                  dismissAlert(a.id);
                }
              });
            },
          },
        ]
      );
    }
  };

  const gateAlertsCount = alerts.filter(a => a.id.startsWith('alert_gate_')).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.responsiveWrapper}>
        {/* Header tinh gọn, không chữ dư thừa */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Thông Báo & Cảnh Báo</Text>

          <View style={styles.headerActions}>
            {gateAlertsCount > 2 && (
              <TouchableOpacity onPress={clearGateLogsOnly} style={styles.clearGateBtn} activeOpacity={0.7}>
                <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
                <Text style={styles.clearGateText}>Dọn cổng ({gateAlertsCount})</Text>
              </TouchableOpacity>
            )}

            {alerts.length > 0 && (
              <TouchableOpacity onPress={confirmClearAll} style={styles.clearAllBtn} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                <Text style={styles.clearAllText}>Xóa tất cả</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Khối tóm tắt nhanh trạng thái an ninh */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: dangerCount > 0 ? '#FEF2F2' : '#ECFDF5' }]}>
              <Ionicons
                name={dangerCount > 0 ? 'shield-outline' : 'shield-checkmark'}
                size={18}
                color={dangerCount > 0 ? COLORS.danger : COLORS.success}
              />
            </View>
            <View>
              <Text style={styles.summaryValue}>{dangerCount > 0 ? 'Nguy cấp' : 'An toàn'}</Text>
              <Text style={styles.summaryLabel}>Hệ thống</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
            </View>
            <View>
              <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{dangerCount}</Text>
              <Text style={styles.summaryLabel}>Báo động</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="warning" size={18} color={COLORS.warning} />
            </View>
            <View>
              <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{warningCount}</Text>
              <Text style={styles.summaryLabel}>Cảnh báo</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="information-circle" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{infoCount}</Text>
              <Text style={styles.summaryLabel}>Hoạt động</Text>
            </View>
          </View>
        </View>

        {/* Thanh chuyển tab bộ lọc rõ ràng 4 mục */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Tất cả ({alerts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'danger' && styles.filterChipDanger]}
            onPress={() => setFilter('danger')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: COLORS.danger }]} />
            <Text style={[styles.filterText, filter === 'danger' && styles.filterTextDanger]}>
              Báo động ({dangerCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'warning' && styles.filterChipWarning]}
            onPress={() => setFilter('warning')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: COLORS.warning }]} />
            <Text style={[styles.filterText, filter === 'warning' && styles.filterTextWarning]}>
              Cảnh báo ({warningCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'info' && styles.filterChipInfo]}
            onPress={() => setFilter('info')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: COLORS.primary }]} />
            <Text style={[styles.filterText, filter === 'info' && styles.filterTextInfo]}>
              Hoạt động ({infoCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Khung mô phỏng sự cố nhanh */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeaderRow}>
            <Ionicons name="flask-outline" size={15} color={COLORS.primary} />
            <Text style={styles.demoTitle}>Thử nghiệm sự cố:</Text>
          </View>

          <View style={styles.demoButtonsGrid}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => triggerSimulationEvent('water_leak')}
              activeOpacity={0.7}
            >
              <View style={[styles.demoBtnIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="water" size={15} color={COLORS.water} />
              </View>
              <Text style={styles.demoBtnText}>Rò rỉ nước</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => triggerSimulationEvent('loud_sound')}
              activeOpacity={0.7}
            >
              <View style={[styles.demoBtnIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="volume-high" size={15} color={COLORS.sound} />
              </View>
              <Text style={styles.demoBtnText}>Tiếng ồn lớn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => triggerSimulationEvent('high_temp')}
              activeOpacity={0.7}
            >
              <View style={[styles.demoBtnIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="flame" size={15} color={COLORS.temperature} />
              </View>
              <Text style={styles.demoBtnText}>Quá nhiệt 41.5°</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => triggerSimulationEvent('invalid_rfid')}
              activeOpacity={0.7}
            >
              <View style={[styles.demoBtnIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="card" size={15} color={COLORS.gate} />
              </View>
              <Text style={styles.demoBtnText}>Thẻ RFID lạ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danh sách thông báo */}
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="shield-checkmark" size={38} color={COLORS.success} />
            </View>
            <Text style={styles.emptyTitle}>Hệ thống an toàn</Text>
            <Text style={styles.emptyDesc}>
              {filter === 'all'
                ? 'Không có thông báo hoặc cảnh báo nào.'
                : `Không có thông báo trong mục "${filter === 'danger' ? 'Báo động' : filter === 'warning' ? 'Cảnh báo' : 'Hoạt động'}".`}
            </Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {filteredAlerts.map(alert => {
              const isDanger = alert.type === 'danger';
              const isWarning = alert.type === 'warning';

              return (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    isDanger && styles.alertCardDanger,
                    isWarning && styles.alertCardWarning,
                    !isDanger && !isWarning && styles.alertCardInfo,
                  ]}
                >
                  <View
                    style={[
                      styles.alertIconCircle,
                      isDanger
                        ? { backgroundColor: '#FEE2E2' }
                        : isWarning
                        ? { backgroundColor: '#FEF3C7' }
                        : { backgroundColor: '#E0F2FE' },
                    ]}
                  >
                    <Ionicons
                      name={isDanger ? 'alert-circle' : isWarning ? 'warning' : 'information-circle'}
                      size={20}
                      color={isDanger ? COLORS.danger : isWarning ? COLORS.warning : COLORS.primary}
                    />
                  </View>

                  <View style={styles.alertContent}>
                    <View style={styles.alertMetaRow}>
                      <View
                        style={[
                          styles.badgePill,
                          isDanger
                            ? styles.badgeDanger
                            : isWarning
                            ? styles.badgeWarning
                            : styles.badgeInfo,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgePillText,
                            isDanger
                              ? styles.badgeDangerText
                              : isWarning
                              ? styles.badgeWarningText
                              : styles.badgeInfoText,
                          ]}
                        >
                          {isDanger ? 'BÁO ĐỘNG' : isWarning ? 'CẢNH BÁO' : 'HOẠT ĐỘNG'}
                        </Text>
                      </View>

                      <Text style={styles.alertTime}>{alert.time}</Text>
                    </View>

                    <Text style={styles.alertTitle} numberOfLines={2}>
                      {alert.title}
                    </Text>
                    {alert.message ? <Text style={styles.alertMessage}>{alert.message}</Text> : null}
                  </View>

                  <TouchableOpacity
                    onPress={() => dismissAlert(alert.id)}
                    style={styles.dismissBtn}
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
    paddingTop: 16,
    paddingBottom: 48,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    gap: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  clearGateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: SIZES.radiusSm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  clearGateText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusSm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  summaryBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SIZES.md,
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusMd,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  filterScroll: {
    marginBottom: SIZES.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  filterChipDanger: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  filterChipWarning: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  filterChipInfo: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  filterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  filterTextDanger: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  filterTextWarning: {
    color: COLORS.warning,
    fontWeight: '700',
  },
  filterTextInfo: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  demoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 12,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  demoTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  demoButtonsGrid: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  demoBtn: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusMd,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoBtnIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    backgroundColor: '#F0FDF4',
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 20,
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#166534',
    textAlign: 'center',
    marginTop: 4,
  },
  alertsList: {
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    gap: 10,
    ...SHADOWS.small,
  },
  alertCardDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  alertCardWarning: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  alertCardInfo: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  badgeDangerText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: '800',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeWarningText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '800',
  },
  badgeInfo: {
    backgroundColor: '#E0F2FE',
  },
  badgeInfoText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  alertTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  alertMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dismissBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
  },
});
