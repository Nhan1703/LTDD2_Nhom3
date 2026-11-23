import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function GateScreen() {
  const { gateState, toggleGate, updateGateMode, rfidInfo, clearGateLogs, triggerSimulationEvent } = useIoT();
  const isOpen = gateState.isOpen;

  // Thời gian đếm ngược đóng cổng tự động
  const [selectedDelay, setSelectedDelay] = useState(gateState.autoCloseDelaySec || 10);
  // Trạng thái mở rộng danh sách nhật ký
  const [showAllLogs, setShowAllLogs] = useState(false);

  const delays = [5, 10, 15, 30, 60];

  // Cập nhật khoảng thời gian chờ đóng cổng
  const handleSelectDelay = (sec) => {
    setSelectedDelay(sec);
    updateGateMode('Auto-Close', sec);
  };

  // Bật/tắt chế độ tự động đóng cổng
  const handleToggleAutoClose = () => {
    const newMode = gateState.mode === 'Auto-Close' ? 'Manual' : 'Auto-Close';
    updateGateMode(newMode, selectedDelay);
  };

  // Xác nhận dọn sạch toàn bộ nhật ký đóng mở cổng
  const handleClearLogs = () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Bạn có muốn xóa toàn bộ lịch sử đóng/mở cổng không?') : true;
      if (ok && clearGateLogs) {
        clearGateLogs();
      }
    } else {
      Alert.alert(
        'Xóa nhật ký cổng',
        'Bạn có muốn xóa toàn bộ lịch sử đóng/mở cổng không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xóa sạch', style: 'destructive', onPress: clearGateLogs },
        ]
      );
    }
  };

  const allLogs = gateState.logs || [];
  const displayedLogs = showAllLogs ? allLogs : allLogs.slice(0, 6);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.responsiveWrapper}>
        {/* Tiêu đề ngắn gọn, không chữ dư thừa */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Kiểm Soát Cổng</Text>
        </View>

        {/* Khối trực quan trạng thái cổng chính */}
        <View style={[styles.gateVisualCard, isOpen ? styles.gateCardOpen : styles.gateCardClosed]}>
          <View style={styles.hardwareBadgeRow}>
            <Text style={styles.hardwareTag}>Servo SG90 • GPIO 13 • {isOpen ? 'Góc 90° (Mở)' : 'Góc 0° (Khóa)'}</Text>
          </View>

          <View
            style={[
              styles.largeIconCircle,
              { backgroundColor: isOpen ? '#FEF3C7' : '#DCFCE7' },
            ]}
          >
            <Ionicons
              name={isOpen ? 'lock-open' : 'lock-closed'}
              size={54}
              color={isOpen ? COLORS.warning : COLORS.success}
            />
          </View>

          <Text style={styles.gateStatusTitle}>
            {isOpen ? 'CỔNG ĐANG MỞ' : 'CỔNG ĐÃ KHÓA AN TOÀN'}
          </Text>
          <Text style={styles.gateStatusDesc}>
            {isOpen
              ? 'Đang mở • Chờ tự động đóng hoặc nhấn nút để khóa'
              : 'Đang khóa an toàn • Dùng thẻ RFID hoặc nhấn nút để mở'}
          </Text>

          {/* Nút điều khiển Mở / Đóng cổng */}
          <TouchableOpacity
            style={[styles.bigGateBtn, isOpen ? styles.btnOpenState : styles.btnCloseState]}
            onPress={() => toggleGate(isOpen ? 'Đóng qua App/Web' : 'Mở qua App/Web')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isOpen ? 'close-circle' : 'key'}
              size={22}
              color={COLORS.white}
            />
            <Text style={styles.bigGateBtnText}>
              {isOpen ? 'Nhấn để Khóa Cổng' : 'Nhấn để Mở Cổng'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Thẻ hiển thị trạng thái đầu đọc thẻ RFID */}
        <View style={styles.rfidHardwareCard}>
          <View style={styles.rfidHardwareHeader}>
            <View style={styles.rfidHeaderLeft}>
              <Ionicons name="hardware-chip-outline" size={18} color={COLORS.gate} />
              <Text style={styles.rfidHardwareTitle}>Đầu đọc thẻ RFID RC522</Text>
            </View>
            <View
              style={[
                styles.rfidLivePill,
                { backgroundColor: rfidInfo?.isValid ? '#DCFCE7' : '#F1F5F9' },
              ]}
            >
              <View
                style={[
                  styles.rfidLiveDot,
                  { backgroundColor: rfidInfo?.isValid ? COLORS.success : COLORS.textMuted },
                ]}
              />
              <Text
                style={[
                  styles.rfidLiveText,
                  { color: rfidInfo?.isValid ? '#15803D' : COLORS.textSecondary },
                ]}
              >
                {rfidInfo?.lastUid ? (rfidInfo.isValid ? 'HỢP LỆ (MASTER)' : 'TỪ CHỐI') : 'SẴN SÀNG QUẸT'}
              </Text>
            </View>
          </View>

          <View style={styles.rfidGridRow}>
            <View style={styles.rfidCol}>
              <Text style={styles.rfidColLabel}>Thẻ vừa quét</Text>
              <Text style={styles.rfidColValue}>{rfidInfo?.lastUid || 'Chưa có'}</Text>
            </View>
            <View style={styles.rfidColDivider} />
            <View style={styles.rfidCol}>
              <Text style={styles.rfidColLabel}>Thẻ Master</Text>
              <Text style={[styles.rfidColValue, { color: COLORS.gate }]}>
                {rfidInfo?.masterUid || '620F0307'}
              </Text>
            </View>
            <View style={styles.rfidColDivider} />
            <View style={styles.rfidCol}>
              <Text style={styles.rfidColLabel}>Thời gian</Text>
              <Text style={styles.rfidColValue}>{rfidInfo?.lastScanTime || 'Vừa xong'}</Text>
            </View>
          </View>
        </View>

        {/* Các nút mở nhanh */}
        <Text style={styles.sectionHeader}>Mở nhanh</Text>
        <View style={styles.quickMethodsRow}>
          <TouchableOpacity
            style={styles.quickMethodBtn}
            onPress={() => toggleGate('Quẹt thẻ RFID Master')}
            activeOpacity={0.7}
          >
            <View style={[styles.methodIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="card" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.quickMethodText}>Thẻ Master</Text>
              <Text style={styles.quickMethodSub}>Hợp lệ (620F0307)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickMethodBtn}
            onPress={() => toggleGate('Nút bấm cơ học')}
            activeOpacity={0.7}
          >
            <View style={[styles.methodIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="radio-button-on" size={20} color={COLORS.success} />
            </View>
            <View>
              <Text style={styles.quickMethodText}>Nút bấm tường</Text>
              <Text style={styles.quickMethodSub}>Nút bấm cơ</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickMethodBtn}
            onPress={() => {
              if (triggerSimulationEvent) triggerSimulationEvent('invalid_rfid');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.methodIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            </View>
            <View>
              <Text style={styles.quickMethodText}>Thẻ lạ đột nhập</Text>
              <Text style={styles.quickMethodSub}>Còi hú báo động</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Thiết lập tự động đóng cổng */}
        <View style={styles.configCard}>
          <View style={styles.configHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.configTitle}>Tự động đóng cổng</Text>
              <Text style={styles.configSubtitle}>
                {gateState.mode === 'Auto-Close'
                  ? `Đang bật (tự đóng sau ${selectedDelay} giây)`
                  : 'Đang tắt (chỉ đóng thủ công)'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.switchToggle,
                gateState.mode === 'Auto-Close' ? styles.switchOn : styles.switchOff,
              ]}
              onPress={handleToggleAutoClose}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.switchThumb,
                  gateState.mode === 'Auto-Close' ? styles.switchThumbOn : styles.switchThumbOff,
                ]}
              />
            </TouchableOpacity>
          </View>

          {gateState.mode === 'Auto-Close' && (
            <View style={styles.delaySelectorArea}>
              <Text style={styles.delayLabel}>Thời gian chờ đóng:</Text>
              <View style={styles.delayChipsRow}>
                {delays.map(sec => (
                  <TouchableOpacity
                    key={sec}
                    style={[
                      styles.delayChip,
                      selectedDelay === sec && styles.delayChipActive,
                    ]}
                    onPress={() => handleSelectDelay(sec)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.delayChipText,
                        selectedDelay === sec && styles.delayChipTextActive,
                      ]}
                    >
                      {sec}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Nhật ký đóng mở cổng */}
        <View style={styles.logSectionHeader}>
          <View>
            <Text style={styles.sectionHeader}>Nhật Ký Đóng / Mở</Text>
            <Text style={styles.logCountText}>{allLogs.length} lượt ghi nhận</Text>
          </View>

          <View style={styles.logHeaderActions}>
            {allLogs.length > 6 && (
              <TouchableOpacity
                onPress={() => setShowAllLogs(!showAllLogs)}
                style={styles.expandLogBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.expandLogText}>{showAllLogs ? 'Thu gọn' : 'Xem tất cả'}</Text>
              </TouchableOpacity>
            )}

            {allLogs.length > 0 && (
              <TouchableOpacity
                onPress={handleClearLogs}
                style={styles.clearLogsBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                <Text style={styles.clearLogsText}>Xóa nhật ký</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Danh sách nhật ký */}
        <View style={styles.logsList}>
          {allLogs.length === 0 ? (
            <View style={styles.emptyLogsBox}>
              <Ionicons name="document-text-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyLogsText}>Chưa có lượt đóng/mở nào được ghi nhận.</Text>
            </View>
          ) : (
            displayedLogs.map((log, idx) => {
              const isLogOpen = log.action.includes('Mở');
              return (
                <View key={log.id || idx} style={styles.logItem}>
                  <View
                    style={[
                      styles.logDot,
                      { backgroundColor: isLogOpen ? COLORS.warning : COLORS.success },
                    ]}
                  />
                  <View style={styles.logDetails}>
                    <Text style={styles.logAction}>{log.action}</Text>
                    <Text style={styles.logMethod}>{log.method}</Text>
                  </View>
                  <View style={styles.logTimeCol}>
                    <Text style={styles.logTime}>{log.time}</Text>
                    <Text style={styles.logDate}>{log.date || 'Hôm nay'}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
    marginBottom: SIZES.md,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  gateVisualCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
    ...SHADOWS.small,
  },
  gateCardOpen: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  gateCardClosed: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  hardwareBadgeRow: {
    marginBottom: 12,
  },
  hardwareTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  largeIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  gateStatusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  gateStatusDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 18,
    maxWidth: 520,
  },
  bigGateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 380,
    paddingVertical: 13,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.small,
  },
  btnCloseState: {
    backgroundColor: COLORS.primary,
  },
  btnOpenState: {
    backgroundColor: COLORS.danger,
  },
  bigGateBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  rfidHardwareCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  rfidHardwareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rfidHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rfidHardwareTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rfidLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusFull,
    gap: 5,
  },
  rfidLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rfidLiveText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rfidGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  rfidCol: {
    alignItems: 'center',
    flex: 1,
  },
  rfidColLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  rfidColValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  rfidColDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  quickMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SIZES.md,
    flexWrap: 'wrap',
  },
  quickMethodBtn: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  methodIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMethodText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  quickMethodSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  configCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  configSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  switchToggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
  },
  switchOn: {
    backgroundColor: COLORS.primary,
  },
  switchOff: {
    backgroundColor: '#CBD5E1',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
  },
  switchThumbOn: {
    transform: [{ translateX: 18 }],
  },
  switchThumbOff: {
    transform: [{ translateX: 0 }],
  },
  delaySelectorArea: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  delayLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  delayChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  delayChip: {
    flex: 1,
    minWidth: 48,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  delayChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  delayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  delayChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  logSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
    gap: 8,
  },
  logCountText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  logHeaderActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  expandLogBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
  },
  expandLogText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  clearLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#FEF2F2',
  },
  clearLogsText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  logsList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  emptyLogsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  emptyLogsText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  logDetails: {
    flex: 1,
  },
  logAction: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logMethod: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  logTimeCol: {
    alignItems: 'flex-end',
  },
  logTime: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  logDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
