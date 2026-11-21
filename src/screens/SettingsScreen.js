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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';
import AddSensorModal from '../components/AddSensorModal';

export default function SettingsScreen() {
  const {
    isSimulating,
    setIsSimulating,
    networkConfig,
    updateSettings,
    resetToDefaults,
  } = useIoT();

  // Cấu hình kết nối trực tiếp ESP32 qua Wi-Fi LAN
  const [hardwareServerUrl, setHardwareServerUrl] = useState(networkConfig?.hardwareServerUrl || 'http://192.168.1.6:5000');
  // Cấu hình kết nối đám mây Firebase Realtime Database
  const [firebaseUrl, setFirebaseUrl] = useState(networkConfig?.firebaseUrl || 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app');
  const [useFirebase, setUseFirebase] = useState(networkConfig?.useFirebase !== false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showHardwareGuide, setShowHardwareGuide] = useState(false);

  // Lưu thiết lập cấu hình mạng
  const handleSaveSettings = () => {
    updateSettings({
      hardwareServerUrl,
      firebaseUrl,
      useFirebase,
    });
    if (Platform.OS === 'web') {
      window.alert('Đã lưu cấu hình kết nối IoT (Firebase Realtime Database & Wi-Fi LAN).');
    } else {
      Alert.alert('Thành công', 'Đã lưu cấu hình kết nối IoT (Firebase Realtime Database & Wi-Fi LAN).');
    }
  };

  // Đặt lại dữ liệu về trạng thái ban đầu
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
      {/* Tiêu đề màn hình cài đặt */}
      <View style={styles.header}>
        <Text style={styles.screenSubtitle}>CẤU HÌNH & KẾT NỐI</Text>
        <Text style={styles.screenTitle}>Cài Đặt Hệ Thống</Text>
      </View>

      {/* Thẻ bật/tắt chế độ mô phỏng khi không có phần cứng */}
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

      {/* Thẻ mở rộng thêm cảm biến mới */}
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

      {/* Hướng dẫn sơ đồ chân GPIO phần cứng ESP32 */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.guideHeaderRow}
          onPress={() => setShowHardwareGuide(!showHardwareGuide)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Sơ đồ nối dây phần cứng ESP32</Text>
            <Text style={styles.cardDesc}>Hướng dẫn kết nối các chân cảm biến và cơ cấu chấp hành</Text>
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
              <Text style={styles.pinDesc}>Chân Analog A0 nối chân GPIO 34 (ESP32).</Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={styles.pinLabel}>🔊 Cảm biến Âm thanh (Sound):</Text>
              <Text style={styles.pinDesc}>Chân OUT nối chân GPIO 35 (ESP32).</Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={styles.pinLabel}>🌡️ Cảm biến DHT11 (Nhiệt độ & Độ ẩm):</Text>
              <Text style={styles.pinDesc}>Chân Data nối chân GPIO 4 (ESP32).</Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={styles.pinLabel}>🚪 Cổng ra vào (Servo Motor SG90):</Text>
              <Text style={styles.pinDesc}>Chân PWM nối GPIO 13 (ESP32) điều khiển góc 0° (Đóng) - 90° (Mở).</Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={styles.pinLabel}>🪪 Đầu đọc RFID RC522 (Giao tiếp SPI):</Text>
              <Text style={styles.pinDesc}>SDA: GPIO 5 | SCK: GPIO 18 | MOSI: GPIO 23 | MISO: GPIO 19 | RST: GPIO 26.</Text>
            </View>
          </View>
        )}
      </View>

      {/* Cấu hình Đám Mây Firebase Realtime Database */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.cardTitle}>Đồng Bộ Firebase Realtime Database</Text>
            <Text style={styles.cardDesc}>
              Đồng bộ dữ liệu cảm biến và nhận lệnh điều khiển tức thì từ xa qua Internet / 4G (Dự án: ltdd-945a5).
            </Text>
          </View>
          <Switch
            value={useFirebase}
            onValueChange={setUseFirebase}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Firebase Realtime DB URL (Máy chủ Singapore)</Text>
          <TextInput
            style={styles.textInput}
            value={firebaseUrl}
            onChangeText={setFirebaseUrl}
            placeholder="https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveSettings}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={18} color={COLORS.white} />
          <Text style={styles.saveBtnText}>Lưu Cấu Hình Firebase</Text>
        </TouchableOpacity>
      </View>

      {/* Cấu hình kết nối trực tiếp ESP32 qua mạng LAN */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kết Nối ESP32 Nội Bộ (Wi-Fi LAN)</Text>
        <Text style={styles.cardDesc}>
          Địa chỉ IP của vi điều khiển ESP32 khi kết nối cùng mạng Wi-Fi cục bộ để phản hồi trực tiếp không qua Internet.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Địa chỉ Web Server ESP32 (HTTP URL)</Text>
          <TextInput
            style={styles.textInput}
            value={hardwareServerUrl}
            onChangeText={setHardwareServerUrl}
            placeholder="http://192.168.1.6:5000 hoặc http://IP_ESP32"
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
          <Text style={styles.saveBtnText}>Lưu Địa Chỉ ESP32 LAN</Text>
        </TouchableOpacity>
      </View>

      {/* Khôi phục cài đặt gốc */}
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

      {/* Thông tin chân trang đồ án */}
      <View style={styles.aboutFooter}>
        <Text style={styles.aboutTitle}>ĐỒ ÁN LẬP TRÌNH DI ĐỘNG (LTDD)</Text>
        <Text style={styles.aboutSubtitle}>NHÓM 3 - HỆ THỐNG IOT SMART HOME & AN NINH CỔNG RA VÀO</Text>
        <Text style={styles.aboutVersion}>Triển khai Vercel Web & Expo Go Mobile (SDK 58)</Text>
      </View>

      {/* Cửa sổ Modal thêm cảm biến */}
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
