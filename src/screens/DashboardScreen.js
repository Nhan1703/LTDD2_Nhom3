import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';
import { SENSOR_TYPES } from '../constants/initialSensors';
import Header from '../components/Header';
import GateControlCard from '../components/GateControlCard';
import WaterSensorCard from '../components/WaterSensorCard';
import SoundSensorCard from '../components/SoundSensorCard';
import TempHumidityCard from '../components/TempHumidityCard';
import GenericSensorCard from '../components/GenericSensorCard';
import AddSensorModal from '../components/AddSensorModal';

export default function DashboardScreen({ navigation, onNavigateTab }) {
  const { sensors, gateState, alerts, toggleGate, toggleLight, isLightOn, rfidInfo } = useIoT();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  // Find standard sensors
  const waterSensor = sensors.find(s => s.type === SENSOR_TYPES.WATER);
  const soundSensor = sensors.find(s => s.type === SENSOR_TYPES.SOUND);
  const tempSensor = sensors.find(s => s.type === SENSOR_TYPES.TEMPERATURE);
  const humSensor = sensors.find(s => s.type === SENSOR_TYPES.HUMIDITY);

  // Additional custom sensors added by the user
  const customSensors = sensors.filter(
    s =>
      s.type !== SENSOR_TYPES.WATER &&
      s.type !== SENSOR_TYPES.SOUND &&
      s.type !== SENSOR_TYPES.TEMPERATURE &&
      s.type !== SENSOR_TYPES.HUMIDITY &&
      s.type !== SENSOR_TYPES.GATE
  );

  const dangerCount = sensors.filter(s => s.value >= s.dangerThreshold).length;

  return (
    <View style={styles.container}>
      <Header
        title="Bảng Điều Khiển"
        subtitle="HỆ THỐNG GIÁM SÁT IOT - NHÓM 3"
        onOpenAddModal={() => setModalVisible(true)}
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
        {/* Quick Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{sensors.length}</Text>
            <Text style={styles.summaryLabel}>Cảm biến</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: gateState.isOpen ? COLORS.warning : COLORS.accent }]}>
              {gateState.isOpen ? 'Mở' : 'Khóa'}
            </Text>
            <Text style={styles.summaryLabel}>Cổng vào</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: dangerCount > 0 ? COLORS.danger : COLORS.success }]}>
              {dangerCount > 0 ? `${dangerCount} Báo động` : 'An toàn'}
            </Text>
            <Text style={styles.summaryLabel}>Trạng thái</Text>
          </View>
        </View>

        {/* Quick Remote Controls Row (Cổng & Đèn LED D2) */}
        <View style={styles.quickControlsRow}>
          {/* Quick Toggle Gate */}
          <TouchableOpacity
            style={[styles.quickControlCard, gateState.isOpen ? styles.controlCardActiveWarning : styles.controlCardNormal]}
            onPress={() => toggleGate('Bảng điều khiển nhanh')}
            activeOpacity={0.8}
          >
            <View style={[styles.controlIconBox, { backgroundColor: gateState.isOpen ? COLORS.warningMuted : COLORS.primaryMuted }]}>
              <Ionicons
                name={gateState.isOpen ? 'lock-open' : 'lock-closed'}
                size={22}
                color={gateState.isOpen ? COLORS.warning : COLORS.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.controlTitle}>Cổng ra vào</Text>
              <Text style={[styles.controlStatus, { color: gateState.isOpen ? COLORS.warning : COLORS.textSecondary }]}>
                {gateState.isOpen ? 'Đang mở' : 'Đã khóa'}
              </Text>
            </View>
            <Ionicons name="power" size={18} color={gateState.isOpen ? COLORS.warning : COLORS.textMuted} />
          </TouchableOpacity>

          {/* Quick Toggle Light */}
          <TouchableOpacity
            style={[styles.quickControlCard, isLightOn ? styles.controlCardActiveLight : styles.controlCardNormal]}
            onPress={toggleLight}
            activeOpacity={0.8}
          >
            <View style={[styles.controlIconBox, { backgroundColor: isLightOn ? '#FEF9C3' : '#F1F5F9' }]}>
              <Ionicons
                name={isLightOn ? 'bulb' : 'bulb-outline'}
                size={22}
                color={isLightOn ? '#CA8A04' : COLORS.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.controlTitle}>Đèn LED (D2)</Text>
              <Text style={[styles.controlStatus, { color: isLightOn ? '#CA8A04' : COLORS.textSecondary }]}>
                {isLightOn ? 'Bật sáng' : 'Tắt'}
              </Text>
            </View>
            <Ionicons name="power" size={18} color={isLightOn ? '#CA8A04' : COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Thẻ RFID vừa quẹt Card */}
        {rfidInfo?.lastUid ? (
          <View style={styles.rfidBannerCard}>
            <View style={[styles.rfidIconCircle, { backgroundColor: rfidInfo.isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons
                name="card"
                size={20}
                color={rfidInfo.isValid ? COLORS.success : COLORS.danger}
              />
            </View>
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.rfidTitle}>Thẻ RFID:</Text>
                <Text style={styles.rfidUid}>{rfidInfo.lastUid}</Text>
              </View>
              <Text style={styles.rfidSub}>
                {rfidInfo.isValid ? '✓ Xác thực mở cửa thành công' : '✕ Thẻ không khớp'} • {rfidInfo.lastScanTime || 'Vừa xong'}
              </Text>
            </View>
            <View style={[styles.rfidStatusBadge, { backgroundColor: rfidInfo.isValid ? COLORS.successMuted : COLORS.dangerMuted }]}>
              <Text style={[styles.rfidStatusText, { color: rfidInfo.isValid ? COLORS.success : COLORS.danger }]}>
                {rfidInfo.isValid ? 'HỢP LỆ' : 'TỪ CHỐI'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Cổng ra vào (Door / Entrance Gate) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Cổng Kiểm Soát Ra Vào</Text>
          <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab('Gate')}>
            <Text style={styles.sectionAction}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
        <GateControlCard onNavigateToGate={() => onNavigateTab && onNavigateTab('Gate')} />

        {/* Core Sensors - Cảm biến phần cứng thực tế (DHT11 Nhiệt độ & Độ ẩm) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Cảm Biến Môi Trường (DHT11)</Text>
          <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab('History')}>
            <Text style={styles.sectionAction}>Lịch sử đo</Text>
          </TouchableOpacity>
        </View>

        {/* Cảm biến Nhiệt độ & Độ ẩm vật lý (DHT11) */}
        <TempHumidityCard tempSensor={tempSensor} humSensor={humSensor} />

        {/* Cảm biến Nước (Nếu có mở rộng kết nối thêm) */}
        {waterSensor && <WaterSensorCard sensor={waterSensor} />}

        {/* Cảm biến Âm thanh (Nếu có mở rộng kết nối thêm) */}
        {soundSensor && <SoundSensorCard sensor={soundSensor} />}

        {/* Dynamic / Additional Sensors (Future expansion) */}
        {customSensors.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Cảm Biến Mở Rộng Thêm</Text>
              <Text style={styles.customCount}>{customSensors.length} thiết bị</Text>
            </View>
            {customSensors.map(sensor => (
              <GenericSensorCard key={sensor.id} sensor={sensor} />
            ))}
          </>
        )}

        {/* Big Add Sensor CTA Card */}
        <TouchableOpacity
          style={styles.addSensorCard}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.addIconCircle}>
            <Ionicons name="add" size={28} color={COLORS.primaryLight} />
          </View>
          <View style={styles.addTextContainer}>
            <Text style={styles.addTitle}>Thêm Cảm Biến Mới</Text>
            <Text style={styles.addSubtitle}>
              Mở rộng hệ thống: Khí gas, Ánh sáng, Chuyển động PIR, Độ ẩm đất...
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Sensor Modal */}
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
    paddingTop: 14,
    paddingBottom: 40,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...SHADOWS.small,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNum: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  quickControlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SIZES.md,
  },
  quickControlCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    gap: 12,
    ...SHADOWS.small,
  },
  controlCardNormal: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
  },
  controlCardActiveWarning: {
    backgroundColor: COLORS.warningMuted,
    borderColor: COLORS.warningBorder,
  },
  controlCardActiveLight: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
  },
  controlIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  controlStatus: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  rfidBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  rfidIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rfidTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  rfidUid: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  rfidSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rfidStatusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusSm,
  },
  rfidStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  customCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  addSensorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    borderStyle: 'dashed',
    marginTop: SIZES.sm,
    gap: 14,
  },
  addIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  addTextContainer: {
    flex: 1,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  addSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
