import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function HistoryScreen() {
  const { sensors, gateState, rfidInfo } = useIoT();
  // Tab đang chọn: có thể là ID của cảm biến hoặc 'gate_rfid'
  const [selectedTab, setSelectedTab] = useState(sensors[0]?.id || 'gate_rfid');

  const isGateTab = selectedTab === 'gate_rfid';
  const activeSensor = sensors.find(s => s.id === selectedTab) || sensors[0];
  const history = activeSensor?.history && activeSensor.history.length > 0 ? activeSensor.history : [25, 25, 25];

  // Tính toán các chỉ số thống kê
  const maxVal = Math.max(...history);
  const minVal = Math.min(...history);
  const avgVal = (history.reduce((a, b) => a + b, 0) / history.length).toFixed(1);
  const deltaVal = (maxVal - minVal).toFixed(1);

  // Phân tích xu hướng biến thiên giữa lần đo mới nhất và cũ nhất
  const firstVal = history[0];
  const lastVal = history[history.length - 1];
  const diffVal = Number((lastVal - firstVal).toFixed(1));

  let trendText = 'Chỉ số ổn định, không có biến động đột ngột';
  let trendIcon = 'swap-horizontal';
  let trendColor = COLORS.primary;

  if (diffVal > 0.3) {
    trendText = `Có xu hướng tăng (+${diffVal} ${activeSensor?.unit || ''} so với các chu kỳ trước)`;
    trendIcon = 'trending-up';
    trendColor = COLORS.warning;
  } else if (diffVal < -0.3) {
    trendText = `Có xu hướng giảm (${diffVal} ${activeSensor?.unit || ''} so với các chu kỳ trước)`;
    trendIcon = 'trending-down';
    trendColor = COLORS.info;
  }

  // Đánh giá chỉ số tiện nghi môi trường theo chuẩn thực tế
  let comfortAssessment = 'Môi trường phòng khách thoải mái, an toàn.';
  if (activeSensor?.type === 'temperature') {
    if (lastVal > 34) {
      comfortAssessment = '⚠️ Nhiệt độ khá cao, nên bật quạt thông gió hoặc điều hòa để làm mát.';
    } else if (lastVal < 20) {
      comfortAssessment = '❄️ Không khí hơi lạnh, nên giữ ấm cho người già và trẻ nhỏ.';
    } else {
      comfortAssessment = '✅ Nhiệt độ lý tưởng (24°C - 27°C), tốt cho sức khỏe và chất lượng giấc ngủ.';
    }
  } else if (activeSensor?.type === 'humidity') {
    if (lastVal > 80) {
      comfortAssessment = '💧 Độ ẩm cao (>80%), dễ gây nồm ẩm và nấm mốc trong nhà. Khuyến nghị bật chế độ Dry.';
    } else if (lastVal < 40) {
      comfortAssessment = '⚠️ Không khí hanh khô (<40%), nên dùng thêm máy tạo độ ẩm phun sương.';
    } else {
      comfortAssessment = '✅ Độ ẩm lý tưởng (50% - 75%), thoải mái cho hệ hô hấp.';
    }
  }

  // Thuật toán Zoom động (Dynamic Scaling): Phóng đại trực quan độ dốc biến thiên khi chênh lệch nhỏ
  const chartMin = minVal - (deltaVal > 0 ? deltaVal * 0.3 : 1);
  const chartMax = maxVal + (deltaVal > 0 ? deltaVal * 0.3 : 1);
  const chartRange = (chartMax - chartMin) || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.responsiveWrapper}>
        {/* Header giải thích rõ ràng mục đích của trang */}
        <View style={styles.header}>
          <Text style={styles.screenSubtitle}>Biểu đồ & phân tích thông số</Text>
          <Text style={styles.screenTitle}>Thống Kê Dữ Liệu IoT</Text>
          <Text style={styles.headerExplain}>
            Trang này thống kê lịch sử biến thiên theo thời gian thực của các cảm biến phần cứng (DHT11, Cổng, RFID) gửi từ ESP32 qua Firebase.
          </Text>
        </View>

        {/* Thanh chuyển đổi chọn cảm biến / đối tượng phân tích */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sensorTabsScroll} contentContainerStyle={styles.sensorTabsRow}>
          {sensors.map(sensor => {
            const isSelected = selectedTab === sensor.id;
            const isTemp = sensor.type === 'temperature';
            const isHum = sensor.type === 'humidity';

            return (
              <TouchableOpacity
                key={sensor.id}
                style={[
                  styles.sensorTab,
                  isSelected && { borderColor: sensor.color, backgroundColor: `${sensor.color}15` },
                ]}
                onPress={() => setSelectedTab(sensor.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={sensor.icon || (isTemp ? 'thermometer' : isHum ? 'cloudy' : 'hardware-chip-outline')}
                  size={16}
                  color={isSelected ? sensor.color : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.sensorTabText,
                    isSelected && { color: sensor.color, fontWeight: '700' },
                  ]}
                >
                  {isTemp ? 'Nhiệt độ (DHT11)' : isHum ? 'Độ ẩm (DHT11)' : sensor.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Tab thống kê an ninh Cổng & RFID */}
          <TouchableOpacity
            style={[
              styles.sensorTab,
              isGateTab && { borderColor: COLORS.gate, backgroundColor: `${COLORS.gate}15` },
            ]}
            onPress={() => setSelectedTab('gate_rfid')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="lock-closed"
              size={16}
              color={isGateTab ? COLORS.gate : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.sensorTabText,
                isGateTab && { color: COLORS.gate, fontWeight: '700' },
              ]}
            >
              Cổng & RFID RC522
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ========================================================================= */}
        {/* NỘI DUNG 1: NẾU ĐANG CHỌN CẢM BIẾN MÔI TRƯỜNG (DHT11 HOẶC CẢM BIẾN KHÁC) */}
        {/* ========================================================================= */}
        {!isGateTab && activeSensor && (
          <>
            {/* Thẻ Biểu Đồ 10 Lần Đo Gần Nhất */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.deviceTagRow}>
                    <Text style={styles.hardwareBadge}>Phần cứng: Cảm biến DHT11 (Chân GPIO 4)</Text>
                  </View>
                  <Text style={styles.chartTitle}>{activeSensor.name}</Text>
                  <Text style={styles.chartSubtitle}>Biểu đồ 10 lần đo gần nhất cập nhật liên tục từ ESP32</Text>
                </View>

                <View style={[styles.unitBadge, { backgroundColor: `${activeSensor.color}20` }]}>
                  <Text style={[styles.unitBadgeText, { color: activeSensor.color }]}>
                    {activeSensor.value} {activeSensor.unit}
                  </Text>
                </View>
              </View>

              {/* Khu vực vẽ biểu đồ cột tỷ lệ dốc phóng to (Dynamic Zoom) */}
              <View style={styles.chartArea}>
                {history.map((val, idx) => {
                  const heightPercent = Math.min(100, Math.max(20, ((val - chartMin) / chartRange) * 100));
                  const isLatest = idx === history.length - 1;

                  return (
                    <View key={idx} style={styles.barCol}>
                      <Text style={[styles.barValueText, isLatest && { color: activeSensor.color, fontWeight: '800' }]}>
                        {val}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${heightPercent}%`,
                              backgroundColor: isLatest ? activeSensor.color : '#CBD5E1',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barIdxText, isLatest && { color: activeSensor.color, fontWeight: '800' }]}>
                        {isLatest ? 'Hiện tại' : `-${history.length - 1 - idx}`}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.chartTimelineNote}>
                Trục hoành: Chu kỳ đo (Mỗi vạch cách nhau ~3 giây) • Cột màu đậm là lần đo mới nhất
              </Text>
            </View>

            {/* Thẻ Đánh Giá Xu Hướng & Lời Khuyên Tiện Nghi */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeaderRow}>
                <Ionicons name={trendIcon} size={18} color={trendColor} />
                <Text style={styles.insightTitle}>Nhận xét xu hướng:</Text>
              </View>
              <Text style={styles.trendText}>{trendText}</Text>

              <View style={styles.divider} />

              <View style={styles.insightHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.success} />
                <Text style={styles.insightTitle}>Đánh giá điều kiện môi trường:</Text>
              </View>
              <Text style={styles.comfortText}>{comfortAssessment}</Text>
            </View>

            {/* Bộ 4 Thẻ Chỉ Số Thống Kê Nhanh */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="arrow-up-circle" size={20} color={COLORS.danger} />
                <Text style={styles.statLabel}>Cao nhất</Text>
                <Text style={styles.statValue}>
                  {maxVal} {activeSensor.unit}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="arrow-down-circle" size={20} color={COLORS.success} />
                <Text style={styles.statLabel}>Thấp nhất</Text>
                <Text style={styles.statValue}>
                  {minVal} {activeSensor.unit}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="calculator-outline" size={20} color={COLORS.primary} />
                <Text style={styles.statLabel}>Trung bình</Text>
                <Text style={styles.statValue}>
                  {avgVal} {activeSensor.unit}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="git-commit-outline" size={20} color={COLORS.warning} />
                <Text style={styles.statLabel}>Biên độ (Δ)</Text>
                <Text style={styles.statValue}>
                  {deltaVal} {activeSensor.unit}
                </Text>
              </View>
            </View>

            {/* Bảng Chi Tiết Thông Số Kỹ Thuật Phần Cứng */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Chi Tiết Tham Số Cảm Biến Phần Cứng</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Tên linh kiện phần cứng</Text>
                <Text style={styles.infoVal}>DHT11 (Digital Temperature & Humidity)</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Chân kết nối vi điều khiển</Text>
                <Text style={styles.infoVal}>GPIO 4 (ESP32 - Giao thức 1-Wire)</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Vị trí lắp đặt giám sát</Text>
                <Text style={styles.infoVal}>{activeSensor.location}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Ngưỡng cảnh báo (Vàng)</Text>
                <Text style={[styles.infoVal, { color: COLORS.warning, fontWeight: '700' }]}>
                  {activeSensor.warningThreshold} {activeSensor.unit}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Ngưỡng nguy hiểm (Đỏ)</Text>
                <Text style={[styles.infoVal, { color: COLORS.danger, fontWeight: '700' }]}>
                  {activeSensor.dangerThreshold} {activeSensor.unit}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Giao thức truyền dữ liệu</Text>
                <Text style={styles.infoVal}>Firebase Realtime Database (Singapore)</Text>
              </View>
            </View>
          </>
        )}

        {/* ========================================================================= */}
        {/* NỘI DUNG 2: NẾU ĐANG CHỌN TAB "CỔNG & RFID RC522" */}
        {/* ========================================================================= */}
        {isGateTab && (
          <>
            {/* Thẻ Tổng Quan Cổng & Thẻ Từ */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hardwareBadge}>Phần cứng: Servo SG90 (GPIO 13) & RC522 (SPI)</Text>
                  <Text style={styles.chartTitle}>Hệ Thống Kiểm Soát Cổng & Thẻ RFID</Text>
                  <Text style={styles.chartSubtitle}>Thống kê trạng thái vận hành và quẹt thẻ an ninh</Text>
                </View>
                <View
                  style={[
                    styles.unitBadge,
                    { backgroundColor: gateState.isOpen ? '#FEF3C7' : '#ECFDF5' },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitBadgeText,
                      { color: gateState.isOpen ? COLORS.warning : COLORS.success },
                    ]}
                  >
                    {gateState.isOpen ? 'CỔNG ĐANG MỞ' : 'CỔNG ĐANG KHÓA'}
                  </Text>
                </View>
              </View>

              {/* Thông tin thẻ RFID gần nhất */}
              <View style={styles.rfidSummaryBox}>
                <View style={styles.rfidHeaderRow}>
                  <Ionicons name="card" size={20} color={COLORS.gate} />
                  <Text style={styles.rfidTitle}>Lần Quẹt Thẻ Gần Nhất (RC522):</Text>
                </View>
                <View style={styles.rfidDetailsRow}>
                  <View style={styles.rfidCol}>
                    <Text style={styles.rfidSubLabel}>Mã thẻ (UID):</Text>
                    <Text style={styles.rfidUidText}>{rfidInfo?.lastUid || '620F0307'}</Text>
                  </View>
                  <View style={styles.rfidCol}>
                    <Text style={styles.rfidSubLabel}>Trạng thái quyền:</Text>
                    <Text style={[styles.rfidStatusText, { color: rfidInfo?.isValid !== false ? COLORS.success : COLORS.danger }]}>
                      {rfidInfo?.isValid !== false ? '✅ Thẻ Hợp Lệ (Master)' : '❌ Thẻ Lạ Bị Từ Chối'}
                    </Text>
                  </View>
                  <View style={styles.rfidCol}>
                    <Text style={styles.rfidSubLabel}>Thời gian quét:</Text>
                    <Text style={styles.rfidTimeText}>{rfidInfo?.lastScanTime || 'Gần đây'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bảng Chi Tiết Thông Số Kỹ Thuật Cổng */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Chi Tiết Tham Số Phần Cứng Cổng</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Động cơ điều khiển cửa</Text>
                <Text style={styles.infoVal}>Servo SG90 PWM (Chân GPIO 13)</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Đầu đọc thẻ RFID</Text>
                <Text style={styles.infoVal}>MFRC522 giao tiếp SPI (GPIO 5, 18, 19, 23, 26)</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Thẻ quyền quản trị (Master)</Text>
                <Text style={[styles.infoVal, { color: COLORS.gate, fontWeight: '700' }]}>
                  {rfidInfo?.masterUid || '620F0307'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Chế độ tự động đóng cửa</Text>
                <Text style={styles.infoVal}>Tự động khóa sau 10 giây</Text>
              </View>
            </View>
          </>
        )}
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
    maxWidth: 960, // Căn giữa và giới hạn độ rộng để không bị bè ngang trên Web Desktop
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
  sensorTabsScroll: {
    marginBottom: SIZES.lg,
  },
  sensorTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sensorTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sensorTabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.lg,
  },
  deviceTagRow: {
    marginBottom: 4,
  },
  hardwareBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  unitBadgeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 16,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barValueText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  barTrack: {
    width: 14,
    height: 95,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barIdxText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  chartTimelineNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  insightCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: SIZES.md,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  trendText: {
    fontSize: 13,
    color: '#166534',
    marginLeft: 24,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#DCFCE7',
    marginVertical: 8,
  },
  comfortText: {
    fontSize: 13,
    color: '#166534',
    marginLeft: 24,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SIZES.md,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusMd,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoKey: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rfidSummaryBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: SIZES.radiusMd,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginTop: SIZES.sm,
  },
  rfidHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rfidTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gate,
  },
  rfidDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  rfidCol: {
    flex: 1,
    minWidth: 100,
  },
  rfidSubLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  rfidUidText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gate,
  },
  rfidStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rfidTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
