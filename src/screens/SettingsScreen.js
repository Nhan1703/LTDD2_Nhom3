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
      <View style={styles.responsiveWrapper}>
        {/* Header màn hình cài đặt */}
        <View style={styles.header}>
          <Text style={styles.screenSubtitle}>Cấu hình & kết nối</Text>
          <Text style={styles.screenTitle}>Cài Đặt Hệ Thống</Text>
          <Text style={styles.headerExplain}>
            Quản lý kết nối đám mây Firebase, mạng LAN ESP32 và sơ đồ chân phần cứng ngoại vi.
          </Text>
        </View>

        {/* ========================================================= */}
        {/* NHÓM 1: KẾT NỐI MẠNG & ĐỒNG BỘ ĐÁM MÂY (NETWORK & CLOUD) */}
        {/* ========================================================= */}
        <Text style={styles.sectionHeader}>Kết Nối Mạng & Đám Mây</Text>

        {/* Thẻ 1: Đồng Bộ Firebase Realtime Database */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="cloud-done-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Đồng Bộ Firebase Realtime Database</Text>
              </View>
              <Text style={styles.cardDesc}>
                Đồng bộ dữ liệu cảm biến và nhận lệnh điều khiển tức thì từ xa qua Internet / 4G (Máy chủ Singapore: ltdd-945a5).
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
            <Text style={styles.inputLabel}>Firebase Realtime DB URL (HTTPS REST API)</Text>
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

        {/* Thẻ 2: Kết Nối ESP32 Nội Bộ (Wi-Fi LAN) với tính năng Tự Động Dò IP */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="wifi-outline" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Kết Nối ESP32 Nội Bộ (Wi-Fi LAN)</Text>
            </View>
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
            Địa chỉ IP nội bộ của vi điều khiển ESP32 khi kết nối cùng mạng Wi-Fi để phản hồi trực tiếp không qua Internet.
          </Text>

          {/* Khối hiển thị kết quả tự động phát hiện IP */}
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
                    window.alert(`Đã tự động cập nhật IP: ${detectedEsp32Ip}`);
                  } else {
                    Alert.alert('Đã nhận diện', `Đã tự động cập nhật IP: ${detectedEsp32Ip}`);
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

        {/* ========================================================= */}
        {/* NHÓM 2: PHẦN CỨNG & SƠ ĐỒ NỐI DÂY (HARDWARE & WIRING) */}
        {/* ========================================================= */}
        <Text style={styles.sectionHeader}>Phần Cứng & Sơ Đồ Nối Dây</Text>

        {/* Thẻ 3: Sơ đồ nối dây phần cứng ESP32 */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.guideHeaderRow}
            onPress={() => setShowHardwareGuide(!showHardwareGuide)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="hardware-chip-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Sơ đồ nối dây phần cứng ESP32</Text>
              </View>
              <Text style={styles.cardDesc}>Bảng tra cứu các chân GPIO kết nối cảm biến và chấp hành</Text>
            </View>
            <Ionicons
              name={showHardwareGuide ? 'chevron-up-circle' : 'chevron-down-circle'}
              size={24}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          {showHardwareGuide && (
            <View style={styles.guideBody}>
              <View style={styles.guideItem}>
                <View style={styles.pinTagBox}>
                  <Text style={styles.pinTagText}>GPIO 4</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinLabel}>🌡️ Cảm biến DHT11 (Nhiệt độ & Độ ẩm)</Text>
                  <Text style={styles.pinDesc}>Chân Data nối chân GPIO 4 (ESP32 - 1-Wire protocol).</Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={[styles.pinTagBox, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.pinTagText, { color: COLORS.primary }]}>GPIO 13</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinLabel}>🚪 Cổng ra vào (Servo Motor SG90)</Text>
                  <Text style={styles.pinDesc}>Chân PWM nối GPIO 13 điều khiển góc 0° (Khóa) - 90° (Mở).</Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={[styles.pinTagBox, { backgroundColor: '#FAF5FF' }]}>
                  <Text style={[styles.pinTagText, { color: COLORS.gate }]}>SPI</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinLabel}>🪪 Đầu đọc thẻ RFID RC522</Text>
                  <Text style={styles.pinDesc}>SDA: GPIO 5 | SCK: 18 | MOSI: 23 | MISO: 19 | RST: 26.</Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={[styles.pinTagBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.pinTagText, { color: '#B45309' }]}>GPIO 2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinLabel}>💡 Đèn LED chiếu sáng & Còi Buzzer</Text>
                  <Text style={styles.pinDesc}>LED: GPIO 2 (Board) | Còi báo động: GPIO 27.</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Thẻ 4: Mở Rộng Thêm Cảm Biến */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Mở Rộng Thêm Cảm Biến</Text>
              </View>
              <Text style={styles.cardDesc}>
                Mở rộng hệ thống: Thêm cảm biến Khí Gas MQ-2, Ánh sáng LDR, Chuyển động PIR, Khói...
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addSensorCompactBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={styles.addSensorCompactBtnText}>Thêm Mới</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* NHÓM 3: HỆ THỐNG & KHÔI PHỤC (SYSTEM & MAINTENANCE) */}
        {/* ========================================================= */}
        <Text style={styles.sectionHeader}>Hệ Thống & Khôi Phục</Text>

        {/* Thẻ 5: Chế độ Mô phỏng (Demo Live) */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="play-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Chế độ Mô phỏng (Demo Live)</Text>
              </View>
              <Text style={styles.cardDesc}>
                Tự động sinh dữ liệu biến thiên phục vụ thuyết trình và thử nghiệm khi chưa cắm phần cứng.
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

        {/* Thẻ 6: Khôi phục cài đặt gốc */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="refresh-circle-outline" size={18} color={COLORS.danger} />
                <Text style={[styles.cardTitle, { color: COLORS.danger }]}>Khôi Phục Trạng Thái Gốc</Text>
              </View>
              <Text style={styles.cardDesc}>Đặt lại toàn bộ danh sách cảm biến, cấu hình và nhật ký ban đầu.</Text>
            </View>

            <TouchableOpacity
              style={styles.resetCompactBtn}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color={COLORS.danger} />
              <Text style={styles.resetCompactBtnText}>Đặt Lại</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Thông tin chân trang đồ án */}
        <View style={styles.aboutFooter}>
          <Text style={styles.aboutTitle}>ĐỒ ÁN LẬP TRÌNH DI ĐỘNG (LTDD) • NHÓM 3</Text>
          <Text style={styles.aboutSubtitle}>HỆ THỐNG IOT SMART HOME & KIỂM SOÁT AN NINH CỔNG RA VÀO</Text>
          <Text style={styles.aboutVersion}>Triển khai trên Web Vercel & Mobile App Expo Go (SDK 58)</Text>
        </View>

        {/* Cửa sổ Modal thêm cảm biến */}
        <AddSensorModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
    maxWidth: 960, // Căn giữa trên màn hình Web Desktop
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
  headerExplain: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  inputGroup: {
    marginTop: SIZES.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
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
    paddingVertical: 12,
    marginTop: SIZES.md,
    ...SHADOWS.small,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
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
    marginTop: SIZES.md,
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
    paddingVertical: 12,
  },
  autoDetectBtnText: {
    color: COLORS.primary,
    fontSize: 13,
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
    paddingVertical: 12,
    ...SHADOWS.small,
  },
  saveLanBtnText: {
    color: COLORS.white,
    fontSize: 13,
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
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  guideItem: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pinTagBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  pinTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.danger,
  },
  pinLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pinDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addSensorCompactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
  },
  addSensorCompactBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  resetCompactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
  },
  resetCompactBtnText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  aboutFooter: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  aboutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  aboutSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  aboutVersion: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
