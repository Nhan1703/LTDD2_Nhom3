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
    networkConfig,
    detectedEsp32Ip,
    updateSettings,
    resetToDefaults,
  } = useIoT();

  // Địa chỉ Web Server ESP32 trong mạng LAN
  const [hardwareServerUrl, setHardwareServerUrl] = useState(networkConfig?.hardwareServerUrl || 'http://192.168.1.6:5000');
  // URL Firebase Realtime Database
  const [firebaseUrl, setFirebaseUrl] = useState(networkConfig?.firebaseUrl || 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app');
  const [useFirebase, setUseFirebase] = useState(networkConfig?.useFirebase !== false);
  const [modalVisible, setModalVisible] = useState(false);
  // Mặc định thu gọn sơ đồ chân để giao diện gọn gàng, người dùng bấm mới mở ra
  const [showHardwareGuide, setShowHardwareGuide] = useState(false);

  // Tự động nhận diện IP nếu ESP32 vừa gửi dữ liệu lên Firebase
  useEffect(() => {
    if (detectedEsp32Ip && (!hardwareServerUrl || hardwareServerUrl.includes('192.168.1.6:5000'))) {
      setHardwareServerUrl(detectedEsp32Ip);
    }
  }, [detectedEsp32Ip]);

  // Lưu cấu hình mạng
  const handleSaveSettings = () => {
    updateSettings({
      hardwareServerUrl,
      firebaseUrl,
      useFirebase,
    });
    if (Platform.OS === 'web') {
      window.alert('Đã lưu cấu hình kết nối.');
    } else {
      Alert.alert('Thành công', 'Đã lưu cấu hình kết nối.');
    }
  };

  // Đặt lại dữ liệu mặc định
  const handleReset = () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Đặt lại toàn bộ danh sách cảm biến về mặc định?') : true;
      if (ok) {
        resetToDefaults().then(() => {
          if (typeof window !== 'undefined') window.alert('Hệ thống đã trở về trạng thái gốc.');
        });
      }
    } else {
      Alert.alert(
        'Khôi phục mặc định',
        'Đặt lại toàn bộ danh sách cảm biến về mặc định?',
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.responsiveWrapper}>
        {/* Header tinh gọn */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>CẤU HÌNH & KẾT NỐI HỆ THỐNG</Text>
          <Text style={styles.screenTitle}>Cài Đặt Hệ Thống</Text>
        </View>

        {/* Nhóm 1: Kết nối mạng */}
        <Text style={styles.sectionHeader}>Kết Nối Mạng</Text>

        {/* Thẻ Firebase */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="cloud-done-outline" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Đồng Bộ Firebase</Text>
            </View>
            <Switch
              value={useFirebase}
              onValueChange={setUseFirebase}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Firebase Realtime DB URL</Text>
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
            <Ionicons name="cloud-upload-outline" size={16} color={COLORS.white} />
            <Text style={styles.saveBtnText}>Lưu Cấu Hình Firebase</Text>
          </TouchableOpacity>
        </View>

        {/* Thẻ ESP32 LAN */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="wifi-outline" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Kết Nối ESP32 (Wi-Fi LAN)</Text>
            </View>
            {detectedEsp32Ip ? (
              <View style={styles.ipFoundBadge}>
                <View style={styles.ipFoundDot} />
                <Text style={styles.ipFoundBadgeText}>Đã tìm thấy</Text>
              </View>
            ) : (
              <View style={styles.ipSearchingBadge}>
                <Ionicons name="radio-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.ipSearchingBadgeText}>Đang dò</Text>
              </View>
            )}
          </View>

          {/* Hộp tự động dò IP */}
          {detectedEsp32Ip ? (
            <View style={styles.ipFoundBox}>
              <View style={{ flex: 1, paddingRight: 6 }}>
                <Text style={styles.ipFoundBoxLabel}>IP ESP32 PHÁT HIỆN:</Text>
                <Text style={styles.ipFoundBoxValue}>{detectedEsp32Ip}</Text>
              </View>
              <TouchableOpacity
                style={styles.applyIpBtn}
                onPress={() => {
                  setHardwareServerUrl(detectedEsp32Ip);
                  updateSettings({ hardwareServerUrl: detectedEsp32Ip });
                  if (Platform.OS === 'web') {
                    window.alert(`Đã tự động điền IP: ${detectedEsp32Ip}`);
                  } else {
                    Alert.alert('Thành công', `Đã tự động điền IP: ${detectedEsp32Ip}`);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="flash" size={13} color={COLORS.white} />
                <Text style={styles.applyIpBtnText}>Tự Động Nhập</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.ipWaitingBox}>
              <Ionicons name="wifi-outline" size={15} color={COLORS.primary} />
              <Text style={styles.ipWaitingBoxText}>
                Đang chờ ESP32 kết nối Wi-Fi để nhận diện IP...
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Địa chỉ Web Server ESP32</Text>
            <TextInput
              style={styles.textInput}
              value={hardwareServerUrl}
              onChangeText={setHardwareServerUrl}
              placeholder="http://192.168.1.23"
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
                    window.alert(`Đã cập nhật IP: ${detectedEsp32Ip}`);
                  } else {
                    Alert.alert('Đã cập nhật', `Đã cập nhật IP: ${detectedEsp32Ip}`);
                  }
                } else {
                  if (Platform.OS === 'web') {
                    window.alert('Đang chờ ESP32 gửi tín hiệu IP lên Firebase.');
                  } else {
                    Alert.alert('Đang dò', 'Đang chờ ESP32 gửi tín hiệu IP lên Firebase.');
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="sync-outline" size={16} color={COLORS.primary} />
              <Text style={styles.autoDetectBtnText}>Dò IP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveLanBtn}
              onPress={handleSaveSettings}
              activeOpacity={0.8}
            >
              <Ionicons name="save-outline" size={16} color={COLORS.white} />
              <Text style={styles.saveLanBtnText}>Lưu Địa Chỉ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nhóm 2: Phần cứng & ngoại vi */}
        <Text style={styles.sectionHeader}>Phần Cứng & Thiết Bị</Text>

        {/* Thẻ Sơ đồ nối dây phần cứng - Thiết kế dạng Accordion thông minh, mặc định thu gọn */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.guideHeaderRow}
            onPress={() => setShowHardwareGuide(!showHardwareGuide)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="hardware-chip-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Sơ đồ chân ESP32</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                {showHardwareGuide ? 'Chạm để thu gọn' : 'Chạm để xem chân cắm phần cứng (khi chấm thi)'}
              </Text>
            </View>
            <Ionicons
              name={showHardwareGuide ? 'chevron-up-circle' : 'chevron-down-circle'}
              size={20}
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
                  <Text style={styles.pinLabel}>Cảm biến DHT11 (Nhiệt độ & Độ ẩm)</Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={[styles.pinTagBox, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.pinTagText, { color: COLORS.primary }]}>GPIO 13</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinLabel}>Cổng Servo SG90 (0° Khóa - 90° Mở)</Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={[styles.pinTagBox, { backgroundColor: '#FAF5FF' }]}>
                  <Text style={[styles.pinTagText, { color: COLORS.gate }]}>SPI</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinLabel}>Đầu đọc thẻ RFID RC522 (SDA: 5, SCK: 18, MOSI: 23, MISO: 19)</Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={[styles.pinTagBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.pinTagText, { color: '#B45309' }]}>GPIO 2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinLabel}>Đèn LED (GPIO 2) & Còi Buzzer (GPIO 27)</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Thẻ Thêm cảm biến */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Thêm Cảm Biến</Text>
            </View>

            <TouchableOpacity
              style={styles.addSensorCompactBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={styles.addSensorCompactBtnText}>Thêm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nhóm: Tài Liệu API & Swagger */}
        <Text style={styles.sectionHeader}>Tài Liệu API & Kiểm Thử</Text>

        {/* Thẻ Tài liệu Swagger UI */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="code-slash-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Tài Liệu API (Swagger UI)</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Xem đặc tả chuẩn OpenAPI 3.0 và gửi lệnh chạy thử trực tiếp (Try it out) cho các API LAN ESP32 & Firebase Cloud.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.swaggerBtn}
              onPress={() => {
                if (typeof window !== 'undefined' && window.open) {
                  window.open('/swagger.html', '_blank');
                } else {
                  Alert.alert(
                    'Swagger API UI',
                    'Bạn có thể truy cập tài liệu Swagger tại đường dẫn:\nhttps://ltdd2nhom3.vercel.app/swagger.html'
                  );
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="open-outline" size={14} color={COLORS.primary} />
              <Text style={styles.swaggerBtnText}>Mở Swagger</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nhóm 3: Vận hành */}
        <Text style={styles.sectionHeader}>Vận Hành</Text>

        {/* Thẻ Đặt lại / Khôi phục mặc định */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="refresh-circle-outline" size={18} color={COLORS.danger} />
                <Text style={[styles.cardTitle, { color: COLORS.danger }]}>Khôi Phục Mặc Định</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Đặt lại cấu hình ngưỡng cảm biến và xóa bộ nhớ tạm của app.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.resetCompactBtn}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={14} color={COLORS.danger} />
              <Text style={styles.resetCompactBtnText}>Đặt Lại</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Thêm cảm biến */}
        <AddSensorModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
  responsiveWrapper: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 12,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.6,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
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
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 15,
  },
  inputGroup: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.cardSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 10,
    marginTop: 10,
    ...SHADOWS.small,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  ipFoundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  ipFoundDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  ipFoundBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  ipSearchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ipSearchingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  ipFoundBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: SIZES.radiusMd,
    padding: 10,
    marginTop: 8,
  },
  ipFoundBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  ipFoundBoxValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  applyIpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: SIZES.radiusSm,
  },
  applyIpBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  ipWaitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSubtle,
    borderRadius: SIZES.radiusMd,
    padding: 8,
    marginTop: 8,
  },
  ipWaitingBoxText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  lanButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
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
    paddingVertical: 10,
  },
  autoDetectBtnText: {
    color: COLORS.primary,
    fontSize: 12,
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
    paddingVertical: 10,
    ...SHADOWS.small,
  },
  saveLanBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  guideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  guideItem: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pinTagBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  pinTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.danger,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addSensorCompactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  addSensorCompactBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  resetCompactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  resetCompactBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  swaggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SIZES.radiusSm,
  },
  swaggerBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
