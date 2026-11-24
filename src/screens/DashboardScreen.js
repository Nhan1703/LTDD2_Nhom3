import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';
import { SENSOR_TYPES } from '../constants/initialSensors';
import Header from '../components/Header';
import WaterSensorCard from '../components/WaterSensorCard';
import SoundSensorCard from '../components/SoundSensorCard';
import TempHumidityCard from '../components/TempHumidityCard';
import GenericSensorCard from '../components/GenericSensorCard';
import AddSensorModal from '../components/AddSensorModal';

export default function DashboardScreen({ navigation, onNavigateTab }) {
  // Lấy dữ liệu và các hàm điều khiển từ ngữ cảnh IoT toàn cục
  const { sensors, gateState, alerts, toggleGate, toggleLight, isLightOn, rfidInfo } = useIoT();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Thao tác kéo xuống để làm mới dữ liệu
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  // Tìm các cảm biến tiêu chuẩn trong danh sách
  const waterSensor = sensors.find(s => s.type === SENSOR_TYPES.WATER);
  const soundSensor = sensors.find(s => s.type === SENSOR_TYPES.SOUND);
  const tempSensor = sensors.find(s => s.type === SENSOR_TYPES.TEMPERATURE);
  const humSensor = sensors.find(s => s.type === SENSOR_TYPES.HUMIDITY);

  // Danh sách các cảm biến mở rộng tùy biến
  const customSensors = sensors.filter(
    s =>
      s.type !== SENSOR_TYPES.WATER &&
      s.type !== SENSOR_TYPES.SOUND &&
      s.type !== SENSOR_TYPES.TEMPERATURE &&
      s.type !== SENSOR_TYPES.HUMIDITY &&
      s.type !== SENSOR_TYPES.GATE
  );

  // Đếm số lượng cảm biến đang vượt ngưỡng báo động
  const dangerCount = sensors.filter(s => s.value >= s.dangerThreshold).length;

  return (
    <View style={styles.container}>
      {/* Header hệ thống 1 tầng tối giản, sang trọng chuẩn Apple */}
      <Header
        title="Bảng Điều Khiển"
        subtitle="HỆ THỐNG IOT • NHÓM 3"
        onOpenAlerts={() => onNavigateTab && onNavigateTab('Alerts')}
        onOpenSettings={() => onNavigateTab && onNavigateTab('Settings')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryLight} />
        }
      >
        <View style={styles.responsiveWrapper}>
          {/* ========================================================================= */}
          {/* DẢI STATUS CHIPS THANH THOÁT (THAY THẾ 3 HỘP CHỮ NHẬT THÔ CŨ) */}
          {/* ========================================================================= */}
          <View style={styles.statusChipsRow}>
            {/* Chip 1: Số cảm biến */}
            <View style={styles.statusChip}>
              <View style={[styles.chipDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.chipText}>{sensors.length} Cảm biến</Text>
            </View>

            {/* Chip 2: Trạng thái cổng */}
            <TouchableOpacity
              style={styles.statusChip}
              onPress={() => onNavigateTab && onNavigateTab('Gate')}
              activeOpacity={0.7}
            >
              <View style={[styles.chipDot, { backgroundColor: gateState.isOpen ? COLORS.warning : COLORS.accent }]} />
              <Text style={styles.chipText}>
                Cổng: {gateState.isOpen ? 'Đang mở' : 'Đã khóa'}
              </Text>
            </TouchableOpacity>

            {/* Chip 3: Mức độ an toàn */}
            <TouchableOpacity
              style={styles.statusChip}
              onPress={() => onNavigateTab && onNavigateTab('Alerts')}
              activeOpacity={0.7}
            >
              <View style={[styles.chipDot, { backgroundColor: dangerCount > 0 ? COLORS.danger : COLORS.success }]} />
              <Text style={styles.chipText}>
                {dangerCount > 0 ? `${dangerCount} Báo động` : 'An toàn'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ========================================================================= */}
          {/* CẢM BIẾN MÔI TRƯỜNG PHẦN CỨNG DHT11 (HERO CLIMATE WIDGET NGUYÊN KHỐI) */}
          {/* ========================================================================= */}
          <TempHumidityCard tempSensor={tempSensor} humSensor={humSensor} />

          {/* ========================================================================= */}
          {/* TRUNG TÂM ĐIỀU KHIỂN & AN NINH (2 SMART TILES SẮC NÉT) */}
          {/* ========================================================================= */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Thiết Bị & An Ninh Cửa Cổng</Text>
            <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab('Gate')}>
              <Text style={styles.sectionAction}>Chi tiết</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickControlsRow}>
            {/* Widget 1: Cổng An Ninh Ra Vào - Tích hợp trạng thái thẻ RFID */}
            <TouchableOpacity
              style={[
                styles.smartTile,
                gateState.isOpen ? styles.tileActiveGate : styles.tileNormal,
              ]}
              onPress={() => toggleGate('Bảng điều khiển nhanh')}
              activeOpacity={0.8}
            >
              <View style={styles.tileHeaderRow}>
                <View style={[styles.tileIconBox, { backgroundColor: gateState.isOpen ? '#FEF3C7' : '#EFF6FF' }]}>
                  <Ionicons
                    name={gateState.isOpen ? 'lock-open' : 'lock-closed'}
                    size={20}
                    color={gateState.isOpen ? COLORS.warning : COLORS.primary}
                  />
                </View>
                {/* Nút nguồn mini phản hồi trạng thái */}
                <View style={[styles.tilePowerBtn, { backgroundColor: gateState.isOpen ? '#FDE68A' : COLORS.cardSubtle }]}>
                  <Ionicons
                    name="power"
                    size={13}
                    color={gateState.isOpen ? '#B45309' : COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={styles.tileFooter}>
                <Text style={styles.tileTitle}>Cổng ra vào</Text>
                <Text style={[styles.tileStatus, { color: gateState.isOpen ? COLORS.warning : COLORS.textSecondary }]}>
                  {gateState.isOpen ? 'Đang mở' : 'Đã khóa'}
                </Text>

                {/* TÍCH HỢP TRẠNG THÁI RFID TRỰC TIẾP VÀO CỔNG */}
                <View style={styles.gateRfidMiniTag}>
                  <Ionicons
                    name="card"
                    size={11}
                    color={rfidInfo?.lastUid ? (rfidInfo.isValid ? COLORS.success : COLORS.danger) : COLORS.textMuted}
                  />
                  <Text style={styles.gateRfidMiniText} numberOfLines={1}>
                    {rfidInfo?.lastUid
                      ? `${rfidInfo.lastUid} • ${rfidInfo.isValid ? 'Hợp lệ' : 'Từ chối'}`
                      : 'Chờ quẹt RFID'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Widget 2: Điều khiển Đèn LED D2 bo mạch ESP32 */}
            <TouchableOpacity
              style={[
                styles.smartTile,
                isLightOn ? styles.tileActiveLight : styles.tileNormal,
              ]}
              onPress={toggleLight}
              activeOpacity={0.8}
            >
              <View style={styles.tileHeaderRow}>
                <View style={[styles.tileIconBox, { backgroundColor: isLightOn ? '#FEF9C3' : '#F1F5F9' }]}>
                  <Ionicons
                    name={isLightOn ? 'bulb' : 'bulb-outline'}
                    size={20}
                    color={isLightOn ? '#CA8A04' : COLORS.textMuted}
                  />
                </View>
                {/* Nút nguồn mini phản hồi trạng thái */}
                <View style={[styles.tilePowerBtn, { backgroundColor: isLightOn ? '#FEF08A' : COLORS.cardSubtle }]}>
                  <Ionicons
                    name="power"
                    size={13}
                    color={isLightOn ? '#CA8A04' : COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={styles.tileFooter}>
                <Text style={styles.tileTitle}>Đèn LED (D2)</Text>
                <Text style={[styles.tileStatus, { color: isLightOn ? '#CA8A04' : COLORS.textSecondary }]}>
                  {isLightOn ? 'Bật sáng' : 'Tắt'}
                </Text>

                {/* Chú thích chân phần cứng */}
                <View style={styles.ledHardwareMiniTag}>
                  <Ionicons name="hardware-chip-outline" size={11} color="#854D0E" />
                  <Text style={styles.ledHardwareMiniText}>GPIO 2 • ESP32</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Cảm biến nước (nếu có kích hoạt) */}
          {waterSensor && <WaterSensorCard sensor={waterSensor} />}

          {/* Cảm biến âm thanh (nếu có kích hoạt) */}
          {soundSensor && <SoundSensorCard sensor={soundSensor} />}

          {/* Các cảm biến tùy biến người dùng tự tạo thêm */}
          {customSensors.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Cảm Biến Mở Rộng</Text>
                <Text style={styles.customCount}>{customSensors.length} thiết bị</Text>
              </View>
              {customSensors.map(sensor => (
                <GenericSensorCard key={sensor.id} sensor={sensor} />
              ))}
            </>
          )}

          {/* ========================================================================= */}
          {/* NÚT THÊM CẢM BIẾN MỚI THANH LỊCH (KHÔNG DÙNG NÉT ĐỨT THÔ) */}
          {/* ========================================================================= */}
          <TouchableOpacity
            style={styles.addSensorCompactCard}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.addMiniIconCircle}>
              <Ionicons name="add" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.addCompactTitle}>Thêm cảm biến hoặc thiết bị mới</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Hộp thoại thêm cảm biến mới */}
      <AddSensorModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SIZES.lg,
    paddingTop: 12,
    paddingBottom: 40,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  // Hàng Status Chips ngang siêu thanh thoát
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    ...SHADOWS.small,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  // Bảng điều khiển nhanh 2 widget
  quickControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  smartTile: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    minHeight: 110,
    ...SHADOWS.small,
  },
  tileNormal: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
  },
  tileActiveGate: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tileActiveLight: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  tileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePowerBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tileFooter: {
    marginTop: 8,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  tileStatus: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  // Tag RFID tích hợp trong Cổng
  gateRfidMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardSubtle,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  gateRfidMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    flex: 1,
  },
  // Tag LED GPIO
  ledHardwareMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  ledHardwareMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#854D0E',
    flex: 1,
  },
  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  // Nút thêm cảm biến gọn gàng
  addSensorCompactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  addMiniIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addCompactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
});
