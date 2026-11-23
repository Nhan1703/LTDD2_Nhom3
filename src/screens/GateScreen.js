import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function GateScreen() {
  const { gateState, toggleGate, updateGateMode, rfidInfo, clearGateLogs, triggerSimulationEvent } = useIoT();
  const isOpen = gateState.isOpen;

  const [selectedDelay, setSelectedDelay] = useState(gateState.autoCloseDelaySec || 10);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const delays = [5, 10, 15, 30, 60];

  const handleSelectDelay = (sec) => {
    setSelectedDelay(sec);
    updateGateMode('Auto-Close', sec);
  };

  const handleToggleAutoClose = () => {
    const newMode = gateState.mode === 'Auto-Close' ? 'Manual' : 'Auto-Close';
    updateGateMode(newMode, selectedDelay);
  };

  // Xác nhận dọn dẹp toàn bộ nhật ký đóng mở cổng
  const handleClearLogs = () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Bạn có muốn xóa toàn bộ lịch sử nhật ký đóng/mở cổng không?') : true;
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
        {/* Header màn hình kiểm soát cổng */}
        <View style={styles.header}>
          <Text style={styles.screenSubtitle}>Hệ thống an ninh & ra vào</Text>
          <Text style={styles.screenTitle}>Kiểm Soát Cổng Tự Động</Text>
        </View>

        {/* Thẻ Trực Quan Trạng Thái Cổng Chính */}
        <View style={[styles.gateVisualCard, isOpen ? styles.gateCardOpen : styles.gateCardClosed]}>
          <View style={styles.hardwareBadgeRow}>
            <Text style={styles.hardwareTag}>Phần cứng: Servo SG90 (GPIO 13) • Góc quay: {isOpen ? '90° (Mở)' : '0° (Khóa)'}</Text>
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
            {isOpen ? 'CỔNG ĐANG MỞ RA VÀO' : 'CỔNG ĐÃ KHÓA AN TOÀN'}
          </Text>
          <Text style={styles.gateStatusDesc}>
            {isOpen
              ? 'Mô-tơ Servo đang quay 90° để mở cổng. Hệ thống đang đếm ngược thời gian tự động khóa.'
              : 'Chốt điện tử Servo 0° đang khóa chốt an toàn tuyệt đối. Cần thẻ RFID hoặc App để mở.'}
          </Text>

          {/* Nút Hành Động Lớn Mở / Đóng Cổng */}
          <TouchableOpacity
            style={[styles.bigGateBtn, isOpen ? styles.btnOpenState : styles.btnCloseState]}
            onPress={() => toggleGate(isOpen ? 'Đóng qua Web/App' : 'Mở qua Web/App')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isOpen ? 'close-circle' : 'key'}
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.bigGateBtnText}>
              {isOpen ? 'Nhấn để Đóng & Khóa Cổng' : 'Nhấn để Mở Cổng Ra Vào'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Thẻ Giám Sát Đầu Đọc Thẻ RFID RC522 Thực Tế */}
        <View style={styles.rfidHardwareCard}>
          <View style={styles.rfidHardwareHeader}>
            <View style={styles.rfidHeaderLeft}>
              <Ionicons name="hardware-chip-outline" size={18} color={COLORS.gate} />
              <Text style={styles.rfidHardwareTitle}>Đầu đọc thẻ RFID RC522 (Giao tiếp SPI ESP32)</Text>
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
              <Text style={styles.rfidColLabel}>Thẻ vừa quét gần nhất</Text>
              <Text style={styles.rfidColValue}>{rfidInfo?.lastUid || 'Chưa có lượt quét'}</Text>
            </View>
            <View style={styles.rfidColDivider} />
            <View style={styles.rfidCol}>
              <Text style={styles.rfidColLabel}>Thẻ Master hệ thống</Text>
              <Text style={[styles.rfidColValue, { color: COLORS.gate }]}>
                {rfidInfo?.masterUid || '620F0307'}
              </Text>
            </View>
            <View style={styles.rfidColDivider} />
            <View style={styles.rfidCol}>
              <Text style={styles.rfidColLabel}>Thời gian quét</Text>
              <Text style={styles.rfidColValue}>{rfidInfo?.lastScanTime || 'Vừa xong'}</Text>
            </View>
          </View>
        </View>

        {/* Phương Thức Mở Nhanh & Mô Phỏng Tình Huống Thực Tế */}
        <Text style={styles.sectionHeader}>Phương thức mở nhanh (Mô phỏng thực tế)</Text>
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
              <Text style={styles.quickMethodText}>Quẹt thẻ Master</Text>
              <Text style={styles.quickMethodSub}>Thẻ hợp lệ (620F0307)</Text>
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
              <Text style={styles.quickMethodSub}>Nút bấm trong nhà</Text>
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
              <Text style={styles.quickMethodSub}>Từ chối & còi hú</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Cấu Hình Tự Động Đóng Cổng */}
        <View style={styles.configCard}>
          <View style={styles.configHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.configTitle}>Tự động đóng cổng (Auto-Close)</Text>
              <Text style={styles.configSubtitle}>
                {gateState.mode === 'Auto-Close'
                  ? `Đang bật: Cổng tự động đếm ngược đóng lại sau ${selectedDelay} giây`
                  : 'Đang tắt: Cổng chỉ đóng khi bạn bấm nút hoặc quẹt thẻ lại'}
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
              <Text style={styles.delayLabel}>Thời gian chờ tự động đóng:</Text>
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
                      {sec} giây
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Nhật Ký Đóng / Mở Cổng Ra Vào */}
        <View style={styles.logSectionHeader}>
          <View>
            <Text style={styles.sectionHeader}>Nhật Ký Đóng / Mở Cổng</Text>
            <Text style={styles.logCountText}>Tổng cộng {allLogs.length} lượt đóng mở đã ghi nhận</Text>
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

        {/* Danh Sách Các Lần Đóng Mở Cổng */}
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
                    <Text style={styles.logMethod}>Phương thức: {log.method}</Text>
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
    backgroundColor: COLORS.background, // Nền xám tuyết hiện đại #F8FAFC
  },
  content: {
    paddingHorizontal: SIZES.lg,
    paddingTop: 16,
    paddingBottom: 48,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 960, // Căn giữa tối ưu trên màn hình Web Desktop
    alignSelf: 'center',
  },
  header: {
    marginBottom: SIZES.md,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  gateStatusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  gateStatusDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    lineHeight: 19,
    maxWidth: 540,
  },
  bigGateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 420,
    paddingVertical: 15,
    borderRadius: SIZES.radiusLg,
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
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
    ...SHADOWS.small,
  },
  rfidHardwareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusFull,
    gap: 6,
  },
  rfidLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  rfidLiveText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rfidGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
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
    marginBottom: 3,
    fontWeight: '500',
  },
  rfidColValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  rfidColDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  quickMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SIZES.lg,
    flexWrap: 'wrap',
  },
  quickMethodBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
    ...SHADOWS.small,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  configSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  switchToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
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
    transform: [{ translateX: 20 }],
  },
  switchThumbOff: {
    transform: [{ translateX: 0 }],
  },
  delaySelectorArea: {
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  delayLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  delayChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  delayChip: {
    flex: 1,
    minWidth: 55,
    paddingVertical: 8,
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
    marginBottom: SIZES.sm,
    gap: 8,
  },
  logCountText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logHeaderActions: {
    flexDirection: 'row',
    gap: 8,
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
    paddingVertical: 32,
    gap: 8,
  },
  emptyLogsText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  logDetails: {
    flex: 1,
  },
  logAction: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logMethod: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logTimeCol: {
    alignItems: 'flex-end',
  },
  logTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  logDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
