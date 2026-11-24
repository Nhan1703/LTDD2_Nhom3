import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function GateScreen() {
  // Lấy dữ liệu và hàm xử lý từ ngữ cảnh IoT
  const { gateState, toggleGate, updateGateMode, rfidInfo, clearGateLogs, triggerSimulationEvent } = useIoT();
  const isOpen = gateState.isOpen;

  // Thời gian đếm ngược tự động đóng cổng (mặc định 10 giây)
  const [selectedDelay, setSelectedDelay] = useState(gateState.autoCloseDelaySec || 10);
  // Trạng thái thu gọn / mở rộng danh sách nhật ký
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Các mốc thời gian tự đóng cổng khả dụng
  const delays = [5, 10, 15, 30, 60];

  // Thay đổi mốc thời gian chờ đóng cổng
  const handleSelectDelay = (sec) => {
    setSelectedDelay(sec);
    updateGateMode('Auto-Close', sec);
  };

  // Chuyển đổi bật/tắt chế độ tự đóng cổng
  const handleToggleAutoClose = () => {
    const newMode = gateState.mode === 'Auto-Close' ? 'Manual' : 'Auto-Close';
    updateGateMode(newMode, selectedDelay);
  };

  // Xác nhận xóa sạch toàn bộ lịch sử đóng/mở cổng
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

  // Danh sách nhật ký thao tác
  const allLogs = gateState.logs || [];
  const displayedLogs = showAllLogs ? allLogs : allLogs.slice(0, 6);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.responsiveWrapper}>
        {/* Header trang kiểm soát cổng tinh gọn và đồng bộ */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>BẢO MẬT & KIỂM SOÁT RA VÀO</Text>
            <Text style={styles.screenTitle}>Kiểm Soát Cổng</Text>
          </View>
          <View style={styles.headerHardwareBadge}>
            <View style={[styles.statusDotLive, { backgroundColor: isOpen ? COLORS.warning : COLORS.success }]} />
            <Text style={styles.headerHardwareText}>
              {isOpen ? 'Cổng Mở' : 'Cổng Khóa'}
            </Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* KHỐI TRỰC QUAN TRẠNG THÁI CỔNG CHÍNH (THIẾT KẾ COMPACT, GỌN GÀNG, KHÔNG BỊ TO QUÁ) */}
        {/* ========================================================================= */}
        <View style={[styles.gateVisualCard, isOpen ? styles.gateCardOpen : styles.gateCardClosed]}>
          {/* Hàng trên: Icon trạng thái + Thông tin cổng */}
          <View style={styles.compactHeaderRow}>
            {/* Vòng tròn icon bảo mật kích thước vừa vặn */}
            <View style={[styles.compactIconCircle, { backgroundColor: isOpen ? '#FEF3C7' : '#DCFCE7' }]}>
              <Ionicons
                name={isOpen ? 'lock-open' : 'lock-closed'}
                size={26}
                color={isOpen ? '#B45309' : '#047857'}
              />
            </View>

            <View style={styles.compactTextGroup}>
              <View style={styles.statusWithTagRow}>
                <Text style={styles.gateStatusTitle}>
                  {isOpen ? 'CỔNG ĐANG MỞ' : 'CỔNG ĐÃ KHÓA AN TOÀN'}
                </Text>
              </View>
              <Text style={styles.gateStatusDesc}>
                {isOpen
                  ? 'Đang mở • Chờ tự đóng hoặc bấm để khóa'
                  : 'Đang khóa an toàn • Dùng thẻ RFID hoặc nút bấm'}
              </Text>
            </View>

            {/* Tag nhỏ thông tin Servo SG90 ở góc */}
            <View style={styles.hardwareMiniTag}>
              <Text style={styles.hardwareMiniTagText}>SG90 • {isOpen ? '90°' : '0°'}</Text>
            </View>
          </View>

          {/* Nút bấm điều khiển Mở / Khóa Cổng chính tinh gọn, thanh lịch */}
          <TouchableOpacity
            style={[styles.compactGateBtn, isOpen ? styles.btnOpenState : styles.btnCloseState]}
            onPress={() => toggleGate(isOpen ? 'Đóng qua App' : 'Mở qua App')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isOpen ? 'lock-closed' : 'key'}
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.compactGateBtnText}>
              {isOpen ? 'Nhấn để Khóa Cổng' : 'Nhấn để Mở Cổng'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* CARD ĐẦU ĐỌC THẺ RFID RC522 (CÁC THẺ CON RÕ RÀNG, DỄ ĐỌC) */}
        {/* ========================================================================= */}
        <View style={styles.rfidHardwareCard}>
          <View style={styles.rfidHardwareHeader}>
            <View style={styles.rfidHeaderLeft}>
              <View style={styles.rfidChipIconBox}>
                <Ionicons name="radio-outline" size={15} color={COLORS.accent} />
              </View>
              <Text style={styles.rfidHardwareTitle}>Đầu đọc thẻ RFID RC522</Text>
            </View>

            {/* Huy hiệu trạng thái xác thực thẻ */}
            <View
              style={[
                styles.rfidLivePill,
                {
                  backgroundColor: rfidInfo?.lastUid
                    ? (rfidInfo.isValid ? COLORS.successMuted : COLORS.dangerMuted)
                    : COLORS.primaryMuted,
                  borderColor: rfidInfo?.lastUid
                    ? (rfidInfo.isValid ? COLORS.successBorder : COLORS.dangerBorder)
                    : COLORS.primaryBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.rfidLiveDot,
                  {
                    backgroundColor: rfidInfo?.lastUid
                      ? (rfidInfo.isValid ? COLORS.success : COLORS.danger)
                      : COLORS.primary,
                  },
                ]}
              />
              <Text
                style={[
                  styles.rfidLiveText,
                  {
                    color: rfidInfo?.lastUid
                      ? (rfidInfo.isValid ? COLORS.success : COLORS.danger)
                      : COLORS.primary,
                  },
                ]}
              >
                {rfidInfo?.lastUid ? (rfidInfo.isValid ? 'HỢP LỆ' : 'TỪ CHỐI') : 'SẴN SÀNG'}
              </Text>
            </View>
          </View>

          {/* 3 ô thẻ thông số UID phân tách độc lập, sắc nét */}
          <View style={styles.rfidGridRow}>
            {/* Ô 1: Thẻ vừa quét */}
            <View style={styles.rfidStatBox}>
              <Text style={styles.rfidStatLabel}>Thẻ vừa quét</Text>
              <Text style={[styles.rfidStatValue, { color: COLORS.primary }]} numberOfLines={1}>
                {rfidInfo?.lastUid || 'Chưa quét'}
              </Text>
            </View>

            {/* Ô 2: Thẻ Master */}
            <View style={styles.rfidStatBox}>
              <Text style={styles.rfidStatLabel}>Thẻ Master</Text>
              <Text style={[styles.rfidStatValue, { color: COLORS.accent }]} numberOfLines={1}>
                {rfidInfo?.masterUid || '620F0307'}
              </Text>
            </View>

            {/* Ô 3: Thời gian quét */}
            <View style={styles.rfidStatBox}>
              <Text style={styles.rfidStatLabel}>Thời gian</Text>
              <Text style={[styles.rfidStatValue, { color: COLORS.textPrimary }]} numberOfLines={1}>
                {rfidInfo?.lastScanTime || 'Vừa xong'}
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* MỞ NHANH: SẮP XẾP CHUẨN 2 HÀNG X 2 CỘT (2 NÚT MỖI HÀNG, KHÔNG RỚT DÒNG) */}
        {/* ========================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Thao Tác Nhanh</Text>
          <Text style={styles.sectionHint}>4 phương thức</Text>
        </View>

        <View style={styles.quickActionsContainer}>
          {/* HÀNG 1: Thẻ Master & Nút Bấm Tường */}
          <View style={styles.quickRow}>
            {/* Nút 1: Thẻ Master */}
            <TouchableOpacity
              style={styles.quickColCard}
              onPress={() => toggleGate('Quẹt thẻ RFID Master')}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="card" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.gridTextBox}>
                <Text style={styles.gridTitle} numberOfLines={1}>Thẻ Master</Text>
                <Text style={styles.gridSub} numberOfLines={1}>Hợp lệ (620F0307)</Text>
              </View>
            </TouchableOpacity>

            {/* Nút 2: Nút bấm cơ học tường */}
            <TouchableOpacity
              style={styles.quickColCard}
              onPress={() => toggleGate('Nút bấm cơ học')}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="radio-button-on" size={18} color={COLORS.success} />
              </View>
              <View style={styles.gridTextBox}>
                <Text style={styles.gridTitle} numberOfLines={1}>Nút Bấm Tường</Text>
                <Text style={styles.gridSub} numberOfLines={1}>Nút bấm cơ</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* HÀNG 2: Mở Nhanh 5s & Thẻ Lạ Đột Nhập */}
          <View style={styles.quickRow}>
            {/* Nút 3: Mở nhanh 5s tự đóng */}
            <TouchableOpacity
              style={styles.quickColCard}
              onPress={() => {
                toggleGate('Mở nhanh 5 giây');
                updateGateMode('Auto-Close', 5);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="flash" size={18} color={COLORS.accent} />
              </View>
              <View style={styles.gridTextBox}>
                <Text style={styles.gridTitle} numberOfLines={1}>Mở Nhanh 5s</Text>
                <Text style={styles.gridSub} numberOfLines={1}>Tự khóa sau 5s</Text>
              </View>
            </TouchableOpacity>

            {/* Nút 4: Giả lập thẻ lạ xâm nhập */}
            <TouchableOpacity
              style={styles.quickColCard}
              onPress={() => {
                if (triggerSimulationEvent) triggerSimulationEvent('invalid_rfid');
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="warning" size={18} color={COLORS.danger} />
              </View>
              <View style={styles.gridTextBox}>
                <Text style={styles.gridTitle} numberOfLines={1}>Thẻ Lạ Đột Nhập</Text>
                <Text style={styles.gridSub} numberOfLines={1}>Còi báo động</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* THIẾT LẬP TỰ ĐỘNG ĐÓNG CỔNG */}
        {/* ========================================================================= */}
        <View style={styles.configCard}>
          <View style={styles.configHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="timer-outline" size={17} color={COLORS.textPrimary} />
                <Text style={styles.configTitle}>Tự động đóng cổng</Text>
              </View>
              <Text style={styles.configSubtitle}>
                {gateState.mode === 'Auto-Close'
                  ? `Đang bật (tự động khóa sau ${selectedDelay}s)`
                  : 'Đang tắt (chỉ đóng thủ công)'}
              </Text>
            </View>

            {/* Nút chuyển đổi Switch Toggle mượt mà */}
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

          {/* Chọn số giây đếm ngược nếu chế độ Auto-Close đang bật */}
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
                      {sec}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ========================================================================= */}
        {/* NHẬT KÝ ĐÓNG / MỞ CỔNG CHI TIẾT */}
        {/* ========================================================================= */}
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
                <Ionicons name="trash-outline" size={13} color={COLORS.danger} />
                <Text style={styles.clearLogsText}>Xóa</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Danh sách các bản ghi nhật ký */}
        <View style={styles.logsList}>
          {allLogs.length === 0 ? (
            <View style={styles.emptyLogsBox}>
              <Ionicons name="document-text-outline" size={30} color={COLORS.textMuted} />
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
    paddingTop: 12,
    paddingBottom: 48,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  // Header tinh gọn
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.6,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  headerHardwareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 5,
    ...SHADOWS.small,
  },
  statusDotLive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  headerHardwareText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  // Khối trực quan trạng thái cổng (Compact Hero Card)
  gateVisualCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  gateCardOpen: {
    borderColor: COLORS.warningBorder,
  },
  gateCardClosed: {
    borderColor: COLORS.successBorder,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  compactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  compactTextGroup: {
    flex: 1,
    paddingRight: 60,
  },
  statusWithTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gateStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  gateStatusDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  hardwareMiniTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  hardwareMiniTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  compactGateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 11,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.small,
  },
  btnCloseState: {
    backgroundColor: COLORS.primary,
  },
  btnOpenState: {
    backgroundColor: COLORS.danger,
  },
  compactGateBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  // Card đầu đọc thẻ RFID
  rfidHardwareCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
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
    gap: 6,
  },
  rfidChipIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rfidHardwareTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rfidLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    gap: 4,
  },
  rfidLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  rfidLiveText: {
    fontSize: 9,
    fontWeight: '800',
  },
  rfidGridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rfidStatBox: {
    flex: 1,
    backgroundColor: COLORS.cardSubtle,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  rfidStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: '600',
  },
  rfidStatValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  // Header phần thao tác
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  // Thao tác nhanh: Chia 2 hàng, mỗi hàng 2 cột cân xứng tuyệt đối
  quickActionsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickColCard: {
    flex: 1,
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
  gridIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTextBox: {
    flex: 1,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  gridSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  // Card cấu hình tự đóng
  configCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  configSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  switchToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: COLORS.primary,
  },
  switchOff: {
    backgroundColor: '#CBD5E1',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  switchThumbOn: {
    transform: [{ translateX: 20 }],
  },
  switchThumbOff: {
    transform: [{ translateX: 0 }],
  },
  delaySelectorArea: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  delayLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  delayChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  delayChip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  delayChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  delayChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  delayChipTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  // Nhật ký
  logSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  logCountText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  logHeaderActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  expandLogBtn: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primaryMuted,
  },
  expandLogText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  clearLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.dangerMuted,
  },
  clearLogsText: {
    fontSize: 10,
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
    paddingVertical: 24,
    gap: 5,
  },
  emptyLogsText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  logDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 10,
  },
  logDetails: {
    flex: 1,
  },
  logAction: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logMethod: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  logTimeCol: {
    alignItems: 'flex-end',
  },
  logTime: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logDate: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
