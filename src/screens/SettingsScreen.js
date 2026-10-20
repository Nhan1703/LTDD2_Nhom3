import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';
import AddSensorModal from '../components/AddSensorModal';

export default function SettingsScreen() {
  const {
    isSimulating,
    setIsSimulating,
    mqttConfig,
    updateSettings,
    resetToDefaults,
  } = useIoT();

  const [hardwareServerUrl, setHardwareServerUrl] = useState(mqttConfig.hardwareServerUrl || 'http://192.168.1.100:5000');
  const [brokerUrl, setBrokerUrl] = useState(mqttConfig.brokerUrl || 'broker.emqx.io');
  const [port, setPort] = useState(mqttConfig.port || '1883');
  const [topicPrefix, setTopicPrefix] = useState(mqttConfig.topicPrefix || 'smart_home_group3');
  const [firebaseUrl, setFirebaseUrl] = useState(mqttConfig.firebaseUrl || '');
  const [modalVisible, setModalVisible] = useState(false);
  const [showHardwareGuide, setShowHardwareGuide] = useState(false);

  const handleSaveSettings = () => {
    updateSettings({
      hardwareServerUrl,
      brokerUrl,
      port,
      topicPrefix,
      firebaseUrl,
    });
    Alert.alert('Thành công', 'Đã lưu cấu hình kết nối IoT.');
  };

  const handleReset = () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Thao tác này sẽ đặt lại toàn bộ danh sách cảm biến về mặc định ban đầu. Bạn có chắc không?') : true;
      if (ok) {
        resetToDefaults().then(() => {
          if (typeof window !== 'undefined') window.alert('Hệ thống đã trở về trạng thái gốc.');
        });
      }
    } else {
      Alert.alert(
        'Khôi phục mặc định',
        'Thao tác này sẽ đặt lại toàn bộ danh sách cảm biến về mặc định ban đầu. Bạn có chắc không?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Khôi phục',
            style: 'destructive',
            onPress: async () => {
              await resetToDefaults();
              Alert.alert('Đã khôi phục', 'Hệ thống đã trở về trạng thái gốc.');
            },
          },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenSubtitle}>CẤU HÌNH & KẾT NỐI</Text>
        <Text style={styles.screenTitle}>Cài Đặt Hệ Thống</Text>
      </View>

      {/* Simulation Mode Toggle Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.cardTitle}>Chế độ Mô phỏng (Demo Live)</Text>
            <Text style={styles.cardDesc}>
              Tự động sinh dữ liệu biến thiên thực tế phục vụ thuyết trình và thử nghiệm khi chưa cắm phần cứng.
            </Text>
          </View>
          <Switch
            value={isSimulating}
            onValueChange={setIsSimulating}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      {/* Sensor Expansion Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mở Rộng Thêm Cảm Biến</Text>
        <Text style={styles.cardDesc}>
          Thêm các cảm biến mới bất kỳ vào hệ thống (Khí Gas, Ánh sáng, Độ ẩm đất, Khói, Chuyển động PIR...).
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Thêm Cảm Biến Mới</Text>
        </TouchableOpacity>
      </View>

      {/* IoT Hardware Guide (ESP32 / Arduino) */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.guideHeaderRow}
          onPress={() => setShowHardwareGuide(!showHardwareGuide)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Sơ đồ nối dây Arduino / ESP32</Text>
            <Text style={styles.cardDesc}>Hướng dẫn kết nối các chân cảm biến thực tế</Text>
          </View>
          <Ionicons
            name={showHardwareGuide ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>

        {showHardwareGuide && (
          <View style={styles.guideBody}>
            <View style={styles.guideItem}>
              <Text style={styles.pinLabel}>💧 Cảm biến Nước (Water Leak):</Text>
              <Text style={styles.pinDesc}>Chân Analog A0 nối chân GPIO 34 (ESP32) hoặc A0 (Arduino).</Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={styles.pinLabel}>🔊 Cảm biến Âm thanh (Sound):</Text>
              <Text style={styles.pinDesc}>Chân OUT nối chân GPIO 35 (ESP32) hoặc A1 (Arduino).</Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={styles.pinLabel}>🌡️ Cảm biến DHT11/DHT22 (Nhiệt độ & Độ ẩm):</Text>
              <Text style={styles.pinDesc}>Chân Data nối chân GPIO 4 (ESP32) hoặc D2 (Arduino).</Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={styles.pinLabel}>🚪 Cổng ra vào (Servo Motor / Chốt khóa từ):</Text>
              <Text style={styles.pinDesc}>Chân PWM nối GPIO 18 (ESP32) điều khiển góc 0° (Đóng) - 90° (Mở).</Text>
            </View>
          </View>
        )}
      </View>

      {/* Arduino / ESP32 Hardware IP Bridge */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kết Nối Arduino / ESP32 Thật</Text>
        <Text style={styles.cardDesc}>
          Địa chỉ IP của Arduino (nếu có WiFi) hoặc IP máy tính chạy script bridge nối Arduino qua cáp USB.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Địa chỉ API Cảm biến (HTTP URL)</Text>
          <TextInput
            style={styles.textInput}
            value={hardwareServerUrl}
            onChangeText={setHardwareServerUrl}
            placeholder="http://192.168.1.100:5000"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveSettings}
          activeOpacity={0.8}
        >
          <Ionicons name="link-outline" size={18} color={COLORS.white} />
          <Text style={styles.saveBtnText}>Lưu Địa Chỉ Kết Nối</Text>
        </TouchableOpacity>
      </View>

      {/* MQTT Broker Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cấu Hình MQTT Broker / Cloud</Text>
        <Text style={styles.cardDesc}>
          Kết nối với MQTT Broker để nhận dữ liệu từ vi điều khiển qua WiFi.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>MQTT Broker Host</Text>
          <TextInput
            style={styles.textInput}
            value={brokerUrl}
            onChangeText={setBrokerUrl}
            placeholder="broker.emqx.io hoặc IP ESP32"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.rowTwoCols}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Port</Text>
            <TextInput
              style={styles.textInput}
              value={port}
              onChangeText={setPort}
              keyboardType="numeric"
              placeholder="1883"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.inputLabel}>Topic Prefix</Text>
            <TextInput
              style={styles.textInput}
              value={topicPrefix}
              onChangeText={setTopicPrefix}
              placeholder="smart_home_group3"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Firebase Realtime DB URL (Tùy chọn)</Text>
          <TextInput
            style={styles.textInput}
            value={firebaseUrl}
            onChangeText={setFirebaseUrl}
            placeholder="https://your-app-default-rtdb.firebaseio.com"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveSettings}
          activeOpacity={0.8}
        >
          <Ionicons name="save-outline" size={18} color={COLORS.white} />
          <Text style={styles.saveBtnText}>Lưu Cấu Hình</Text>
        </TouchableOpacity>
      </View>

      {/* Reset Defaults */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dọn Dẹp & Đặt Lại</Text>
        <Text style={styles.cardDesc}>Khôi phục lại danh sách các cảm biến và nhật ký ban đầu.</Text>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color={COLORS.danger} />
          <Text style={styles.resetBtnText}>Khôi phục trạng thái gốc</Text>
        </TouchableOpacity>
      </View>

      {/* App Info Footer */}
      <View style={styles.aboutFooter}>
        <Text style={styles.aboutTitle}>ĐỒ ÁN LẬP TRÌNH DI ĐỘNG (LTDD)</Text>
        <Text style={styles.aboutSubtitle}>NHÓM 3 - HỆ THỐNG IOT SMART HOME & AN NINH</Text>
        <Text style={styles.aboutVersion}>Phiên bản 1.0.0 (Expo SDK 58)</Text>
      </View>

      {/* Add Sensor Modal */}
      <AddSensorModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
    letterSpacing: 1.2,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 12,
    marginTop: SIZES.md,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  guideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideBody: {
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  guideItem: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 10,
    borderRadius: SIZES.radiusSm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryLight,
  },
  pinLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pinDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  inputGroup: {
    marginTop: SIZES.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 12,
    marginTop: SIZES.lg,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: SIZES.radiusMd,
    paddingVertical: 12,
    marginTop: SIZES.md,
  },
  resetBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  aboutFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aboutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 0.8,
  },
  aboutSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  aboutVersion: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
