import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';
import { SENSOR_TYPES } from '../constants/initialSensors';
import Header from '../components/Header';
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

  // Tìm 2 cảm biến phần cứng chính (Nhiệt độ & Độ ẩm DHT11)
  const tempSensor = sensors.find(s => s.type === SENSOR_TYPES.TEMPERATURE);
  const humSensor = sensors.find(s => s.type === SENSOR_TYPES.HUMIDITY);

  // Danh sách các cảm biến mở rộng tùy biến người dùng thêm vào
  const customSensors = sensors.filter(
    s =>
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
              <View
                style={[
                  styles.chipDot,
                  { backgroundColor: gateState.isOpen ? COLORS.warning : COLORS.primary },
                ]}
              />
              <Text style={styles.chipText}>
                {gateState.isOpen ? 'Cổng: Đang mở' : 'Cổng: Đã khóa'}
              </Text>
            </TouchableOpacity>

            {/* Chip 3: Trạng thái an toàn hệ thống */}
            <TouchableOpacity
              style={styles.statusChip}
              onPress={() => onNavigateTab && onNavigateTab('Alerts')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.chipDot,
                  { backgroundColor: dangerCount > 0 ? COLORS.danger : COLORS.success },
                ]}
              />
              <Text style={styles.chipText}>
                {dangerCount > 0 ? `${dangerCount} Cảnh báo` : 'An toàn'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ========================================================================= */}
          {/* TRUNG TÂM MÔI TRƯỜNG PHÒNG KHÁCH: CARD DHT11 SIÊU CẤP ĐƯỢC NÂNG LÊN TẦNG 1 */}
          {/* ========================================================================= */}
          {tempSensor && humSensor && (
            <TempHumidityCard
              tempSensor={tempSensor}
              humSensor={humSensor}
              onPress={() => onNavigateTab && onNavigateTab('History')}
            />
          )}

          {/* ========================================================================= */}
          {/* TIÊU ĐỀ KHU VỰC ĐIỀU KHIỂN THIẾT BỊ VẬT LÝ */}
          {/* ========================================================================= */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Thiết Bị & An Ninh Cửa Cổng</Text>
            <TouchableOpacity
              onPress={() => onNavigateTab && onNavigateTab('Gate')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionAction}>Chi tiết</Text>
            </TouchableOpacity>
          </View>

          {/* ========================================================================= */}
          {/* 2 SMART TILES: CỔNG AN NINH & ĐÈN LED CHIẾU SÁNG */}
          {/* ========================================================================= */}
          <View style={styles.quickControlsRow}>
            {/* Tile 1: Cổng kiểm soát an ninh Servo SG90 */}
            <TouchableOpacity
              style={[
                styles.smartTile,
                gateState.isOpen ? styles.tileActiveGate : styles.tileNormal,
              ]}
              onPress={() => toggleGate('Điều khiển từ Bảng điều khiển')}
              activeOpacity={0.8}
            >
              <View style={styles.tileTopRow}>
                <View
                  style={[
                    styles.tileIconCircle,
                    {
                      backgroundColor: gateState.isOpen
                        ? COLORS.warningMuted
                        : COLORS.primaryMuted,
                    },
                  ]}
                >
                  <Ionicons
                    name={gateState.isOpen ? 'lock-open' : 'lock-closed'}
                    size={20}
                    color={gateState.isOpen ? COLORS.warning : COLORS.primary}
                  />
                </View>
                <View style={styles.tileMiniSwitch}>
                  <Ionicons
                    name="power"
                    size={13}
                    color={gateState.isOpen ? COLORS.warning : COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={styles.tileBottomInfo}>
                <Text style={styles.tileTitle}>Cổng ra vào</Text>
                <Text
                  style={[
                    styles.tileStateText,
                    { color: gateState.isOpen ? COLORS.warning : COLORS.textSecondary },
                  ]}
                >
                  {gateState.isOpen ? 'Đang mở' : 'Đã khóa'}
                </Text>

                {/* Huy hiệu quẹt thẻ RFID gần nhất lồng ghép gọn gàng */}
                {rfidInfo?.lastUid ? (
                  <View style={styles.rfidMiniBadge}>
                    <Ionicons
                      name="card-outline"
                      size={11}
                      color={rfidInfo.isValid ? COLORS.success : COLORS.danger}
                    />
                    <Text
                      style={[
                        styles.rfidMiniText,
                        { color: rfidInfo.isValid ? COLORS.success : COLORS.danger },
                      ]}
                      numberOfLines={1}
                    >
                      {rfidInfo.lastUid} • {rfidInfo.isValid ? 'Hợp lệ' : 'Từ chối'}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>

            {/* Tile 2: Đèn LED chiếu sáng thông minh GPIO 2 */}
            <TouchableOpacity
              style={[
                styles.smartTile,
                isLightOn ? styles.tileActiveLight : styles.tileNormal,
              ]}
              onPress={toggleLight}
              activeOpacity={0.8}
            >
              <View style={styles.tileTopRow}>
                <View
                  style={[
                    styles.tileIconCircle,
                    {
                      backgroundColor: isLightOn ? '#FEF08A' : COLORS.cardSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name={isLightOn ? 'bulb' : 'bulb-outline'}
                    size={20}
                    color={isLightOn ? '#CA8A04' : COLORS.textMuted}
                  />
                </View>
                <View style={styles.tileMiniSwitch}>
                  <Ionicons
                    name="power"
                    size={13}
                    color={isLightOn ? '#CA8A04' : COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={styles.tileBottomInfo}>
                <Text style={styles.tileTitle}>Đèn LED (D2)</Text>
                <Text
                  style={[
                    styles.tileStateText,
                    { color: isLightOn ? '#A16207' : COLORS.textSecondary },
                  ]}
                >
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

          {/* Các cảm biến tùy biến người dùng tự tạo thêm (MQ2, Ánh sáng, Chuyển động...) */}
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
            activeOpacity={0.7}
          >
            <View style={styles.addMiniIconCircle}>
              <Ionicons name="add" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.addCompactTitle}>Thêm cảm biến hoặc thiết bị mới</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal thêm cảm biến mở rộng */}
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
  tileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileMiniSwitch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tileBottomInfo: {
    marginTop: 2,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tileStateText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  rfidMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardSubtle,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rfidMiniText: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
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
