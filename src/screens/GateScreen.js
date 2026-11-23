import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function GateScreen() {
  const { gateState, toggleGate, updateGateMode, rfidInfo } = useIoT();
  const isOpen = gateState.isOpen;

  const [selectedDelay, setSelectedDelay] = useState(gateState.autoCloseDelaySec || 10);

  const delays = [5, 10, 15, 30, 60];

  const handleSelectDelay = (sec) => {
    setSelectedDelay(sec);
    updateGateMode('Auto-Close', sec);
  };

  const handleToggleAutoClose = () => {
    const newMode = gateState.mode === 'Auto-Close' ? 'Manual' : 'Auto-Close';
    updateGateMode(newMode, selectedDelay);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.screenSubtitle}>Hệ thống an ninh & ra vào</Text>
        <Text style={styles.screenTitle}>Kiểm Soát Cổng Tự Động</Text>
      </View>

      {/* Main Gate Visual Card */}
      <View style={[styles.gateVisualCard, isOpen ? styles.gateCardOpen : styles.gateCardClosed]}>
        <View style={[styles.largeIconCircle, { backgroundColor: isOpen ? COLORS.warningMuted : COLORS.successMuted }]}>
          <Ionicons
            name={isOpen ? 'lock-open' : 'lock-closed'}
            size={56}
            color={isOpen ? COLORS.warning : COLORS.success}
          />
        </View>

        <Text style={styles.gateStatusTitle}>
          {isOpen ? 'Cổng đang mở' : 'Cổng đã khóa chặt'}
        </Text>
        <Text style={styles.gateStatusDesc}>
          {isOpen
            ? 'Cửa đang ở trạng thái mở. Vui lòng quan sát an toàn.'
            : 'Hệ thống chốt điện tử đã được khóa an toàn tuyệt đối.'}
        </Text>

        {/* Big Action Button */}
        <TouchableOpacity
          style={[styles.bigGateBtn, isOpen ? styles.btnOpenState : styles.btnCloseState]}
          onPress={() => toggleGate('Ứng dụng di động')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isOpen ? 'close-circle' : 'key'}
            size={26}
            color={COLORS.white}
          />
          <Text style={styles.bigGateBtnText}>
            {isOpen ? 'Nhấn để Đóng Cổng ngay' : 'Nhấn để Mở Cổng ra vào'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* RFID Live Hardware Monitor */}
      <View style={styles.rfidHardwareCard}>
        <View style={styles.rfidHardwareHeader}>
          <View style={styles.rfidHeaderLeft}>
            <Ionicons name="hardware-chip-outline" size={18} color={COLORS.primary} />
            <Text style={styles.rfidHardwareTitle}>Đầu đọc thẻ RFID RC522 (ESP32)</Text>
          </View>
          <View style={[styles.rfidLivePill, { backgroundColor: rfidInfo?.isValid ? COLORS.successMuted : '#F1F5F9' }]}>
            <View style={[styles.rfidLiveDot, { backgroundColor: rfidInfo?.isValid ? COLORS.success : COLORS.textMuted }]} />
            <Text style={[styles.rfidLiveText, { color: rfidInfo?.isValid ? COLORS.success : COLORS.textSecondary }]}>
              {rfidInfo?.lastUid ? (rfidInfo.isValid ? 'ĐÃ XÁC THỰC' : 'TỪ CHỐI') : 'CHỜ QUẸT'}
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
            <Text style={styles.rfidColLabel}>Thẻ Master hệ thống</Text>
            <Text style={styles.rfidColValue}>{rfidInfo?.masterUid || '239A6C06'}</Text>
          </View>
          <View style={styles.rfidColDivider} />
          <View style={styles.rfidCol}>
            <Text style={styles.rfidColLabel}>Thời gian</Text>
            <Text style={styles.rfidColValue}>{rfidInfo?.lastScanTime || 'Mặc định'}</Text>
          </View>
        </View>
      </View>

      {/* Quick Test Methods */}
      <Text style={styles.sectionHeader}>Phương thức mở nhanh (Mô phỏng thực tế)</Text>
      <View style={styles.quickMethodsRow}>
        <TouchableOpacity
          style={styles.quickMethodBtn}
          onPress={() => toggleGate('Quẹt thẻ RFID')}
          activeOpacity={0.7}
        >
          <Ionicons name="card-outline" size={22} color={COLORS.primary} />
          <Text style={styles.quickMethodText}>Quẹt thẻ RFID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickMethodBtn}
          onPress={() => toggleGate('Nút bấm cơ học')}
          activeOpacity={0.7}
        >
          <Ionicons name="radio-button-on" size={22} color={COLORS.secondary} />
          <Text style={styles.quickMethodText}>Nút bấm tường</Text>
        </TouchableOpacity>
      </View>

      {/* Auto-Close Configuration */}
      <View style={styles.configCard}>
        <View style={styles.configHeader}>
          <View>
            <Text style={styles.configTitle}>Tự động đóng cổng</Text>
            <Text style={styles.configSubtitle}>Tự kích hoạt đóng cổng sau khi mở</Text>
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
                    {sec}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Access Logs */}
      <View style={styles.logSectionHeader}>
        <Text style={styles.sectionHeader}>Nhật Ký Đóng / Mở Cổng</Text>
        <Text style={styles.logCountText}>{(gateState.logs || []).length} lượt ghi</Text>
      </View>

      <View style={styles.logsList}>
        {(gateState.logs || []).slice(0, 8).map((log, idx) => {
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
                <Text style={styles.logDate}>{log.date}</Text>
              </View>
            </View>
          );
        })}
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
    paddingTop: 10,
    paddingBottom: 40,
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
    fontSize: 22,
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
    borderColor: COLORS.warningBorder,
  },
  gateCardClosed: {
    borderColor: COLORS.border,
  },
  largeIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gateStatusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  gateStatusDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  bigGateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 16,
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
    fontSize: 16,
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
    gap: 6,
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
    borderRadius: 4,
  },
  rfidLiveText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rfidGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  rfidCol: {
    alignItems: 'center',
    flex: 1,
  },
  rfidColLabel: {
    fontSize: 12,
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
    height: 20,
    backgroundColor: COLORS.border,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  quickMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SIZES.lg,
  },
  quickMethodBtn: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  quickMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  configCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
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
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    borderTopColor: COLORS.border,
  },
  delayLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  delayChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  delayChip: {
    flex: 1,
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
    fontSize: 13,
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
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  logCountText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  logsList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.small,
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
    fontSize: 13,
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
