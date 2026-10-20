import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
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
  const { sensors, gateState, alerts } = useIoT();
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

        {/* Cổng ra vào (Door / Entrance Gate) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Cổng Kiểm Soát Ra Vào</Text>
          <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab('Gate')}>
            <Text style={styles.sectionAction}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
        <GateControlCard onNavigateToGate={() => onNavigateTab && onNavigateTab('Gate')} />

        {/* Core Sensors */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Cảm Biến Môi Trường & An Toàn</Text>
          <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab('History')}>
            <Text style={styles.sectionAction}>Lịch sử đo</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Cảm biến Nước */}
        <WaterSensorCard sensor={waterSensor} />

        {/* 2. Cảm biến Âm thanh */}
        <SoundSensorCard sensor={soundSensor} />

        {/* 3. Cảm biến Nhiệt độ & Độ ẩm (DHT11/22) */}
        <TempHumidityCard tempSensor={tempSensor} humSensor={humSensor} />

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
    paddingBottom: 40,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusMd,
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
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
  customCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  addSensorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    borderStyle: 'dashed',
    marginTop: SIZES.sm,
    gap: 14,
  },
  addIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTextContainer: {
    flex: 1,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
