import React, { useState, useEffect } from 'react';
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
    detectedEsp32Ip,
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

  // Tự động điền IP của ESP32 nếu hệ thống phát hiện từ Firebase Cloud
  useEffect(() => {
    if (detectedEsp32Ip && (!hardwareServerUrl || hardwareServerUrl.includes('192.168.1.6:5000'))) {
      setHardwareServerUrl(detectedEsp32Ip);
    }
  }, [detectedEsp32Ip]);

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
        <Text style={styles.screenSubtitle}>Cấu hình & kết nối</Text>
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

      {/* Cấu hình kết nối trực tiếp ESP32 qua mạng Wi-Fi LAN với tính năng tự động nhận diện IP */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Kết Nối ESP32 Nội Bộ (Wi-Fi LAN)</Text>
          {detectedEsp32Ip ? (
            <View style={styles.ipFoundBadge}>
              <View style={styles.ipFoundDot} />
              <Text style={styles.ipFoundBadgeText}>Đã tìm thấy</Text>
            </View>
          ) : (
            <View style={styles.ipSearchingBadge}>
              <Ionicons name="radio-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.ipSearchingBadgeText}>Đang dò tìm</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardDesc}>
          Địa chỉ IP của vi điều khiển ESP32 khi kết nối cùng mạng Wi-Fi cục bộ để phản hồi trực tiếp không qua Internet.
        </Text>

        {/* Khối hiển thị kết quả tự động phát hiện IP từ Firebase */}
        {detectedEsp32Ip ? (
          <View style={styles.ipFoundBox}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.ipFoundBoxLabel}>⚡ ĐÃ TỰ ĐỘNG PHÁT HIỆN IP ESP32:</Text>
              <Text style={styles.ipFoundBoxValue}>{detectedEsp32Ip}</Text>
            </View>
            <TouchableOpacity
              style={styles.applyIpBtn}
              onPress={() => {
                setHardwareServerUrl(detectedEsp32Ip);
                updateSettings({ hardwareServerUrl: detectedEsp32Ip });
                if (Platform.OS === 'web') {
                  window.alert(`Đã tự động điền IP ${detectedEsp32Ip} vào cấu hình LAN!`);
                } else {
                  Alert.alert('Thành công', `Đã tự động điền IP ${detectedEsp32Ip} vào cấu hình LAN!`);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="flash" size={14} color={COLORS.white} />
              <Text style={styles.applyIpBtnText}>Tự Động Nhập</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ipWaitingBox}>
            <Ionicons name="wifi-outline" size={16} color={COLORS.primary} />
            <Text style={styles.ipWaitingBoxText}>
              Hệ thống đang tự động lắng nghe địa chỉ IP khi ESP32 cắm nguồn và kết nối Wi-Fi...
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Địa chỉ Web Server ESP32 (HTTP URL)</Text>
          <TextInput
            style={styles.textInput}
            value={hardwareServerUrl}
            onChangeText={setHardwareServerUrl}
            placeholder="http://192.168.1.23 hoặc http://IP_ESP32"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.lanButtonsRow}>
          <TouchableOpacity
            style={styles.autoDetectBtn}
            onPress={() => {
              if (detectedEsp32Ip) {
                setHardwareServerUrl(detectedEsp32Ip);
                updateSettings({ hardwareServerUrl: detectedEsp32Ip });
                if (Platform.OS === 'web') {
                  window.alert(`Đã tự động nhận diện và cập nhật IP: ${detectedEsp32Ip}`);
                } else {
                  Alert.alert('Đã nhận diện', `Đã tự động nhận diện và cập nhật IP: ${detectedEsp32Ip}`);
                }
              } else {
                if (Platform.OS === 'web') {
                  window.alert('Đang chờ ESP32 gửi tín hiệu IP lên Firebase Cloud. Vui lòng cắm nguồn ESP32 và đảm bảo đã kết nối Wi-Fi.');
                } else {
                  Alert.alert('Đang dò tìm', 'Đang chờ ESP32 gửi tín hiệu IP lên Firebase Cloud. Vui lòng cắm nguồn ESP32 và đảm bảo đã kết nối Wi-Fi.');
                }
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="sync-outline" size={18} color={COLORS.primary} />
            <Text style={styles.autoDetectBtnText}>Tự Động Dò IP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveLanBtn}
            onPress={handleSaveSettings}
            activeOpacity={0.8}
          >
            <Ionicons name="save-outline" size={18} color={COLORS.white} />
            <Text style={styles.saveLanBtnText}>Lưu Địa Chỉ</Text>
          </TouchableOpacity>
        </View>
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
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
    ...SHADOWS.small,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
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
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: SIZES.radiusSm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  pinLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pinDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  inputGroup: {
    marginTop: SIZES.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 14,
    marginTop: SIZES.lg,
    ...SHADOWS.small,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerMuted,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 14,
    marginTop: SIZES.md,
  },
  resetBtnText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  aboutFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  aboutSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  aboutVersion: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ipFoundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ipFoundDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  ipFoundBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  ipSearchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    backgroundColor: '#F1F5F9',
  },
  ipSearchingBadgeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  ipFoundBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: SIZES.radiusMd,
    padding: 12,
    marginTop: SIZES.md,
  },
  ipFoundBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 0.3,
  },
  ipFoundBoxValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  applyIpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusSm,
    ...SHADOWS.small,
  },
  applyIpBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  ipWaitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: SIZES.radiusMd,
    padding: 12,
    marginTop: SIZES.md,
  },
  ipWaitingBoxText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
    lineHeight: 18,
  },
  lanButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SIZES.lg,
  },
  autoDetectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: SIZES.radiusMd,
    paddingVertical: 14,
  },
  autoDetectBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  saveLanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 14,
    ...SHADOWS.small,
  },
  saveLanBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
