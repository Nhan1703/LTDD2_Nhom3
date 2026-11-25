import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { SENSOR_PRESETS } from '../constants/initialSensors';
import { useIoT } from '../context/IoTContext';

export default function AddSensorModal({ visible, onClose }) {
  const { addSensor } = useIoT();

  const [selectedPreset, setSelectedPreset] = useState(SENSOR_PRESETS[0]);
  const [name, setName] = useState(SENSOR_PRESETS[0].name);
  const [location, setLocation] = useState('Phòng khách');
  const [unit, setUnit] = useState(SENSOR_PRESETS[0].unit);
  const [min, setMin] = useState(String(SENSOR_PRESETS[0].min));
  const [max, setMax] = useState(String(SENSOR_PRESETS[0].max));
  const [warningThreshold, setWarningThreshold] = useState(String(SENSOR_PRESETS[0].warningThreshold));
  const [dangerThreshold, setDangerThreshold] = useState(String(SENSOR_PRESETS[0].dangerThreshold));

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setName(preset.name);
    setUnit(preset.unit);
    setMin(String(preset.min));
    setMax(String(preset.max));
    setWarningThreshold(String(preset.warningThreshold));
    setDangerThreshold(String(preset.dangerThreshold));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    addSensor({
      type: selectedPreset.type,
      name: name.trim(),
      location: location.trim() || 'Khu vực tự do',
      unit: unit.trim() || '',
      min: parseFloat(min) || 0,
      max: parseFloat(max) || 100,
      warningThreshold: parseFloat(warningThreshold) || 70,
      dangerThreshold: parseFloat(dangerThreshold) || 90,
      icon: selectedPreset.icon,
      color: selectedPreset.color,
      description: selectedPreset.description,
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Thêm Cảm Biến Mới</Text>
              <Text style={styles.sheetSubtitle}>Mở rộng hệ thống giám sát IoT</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Presets Selector */}
            <Text style={styles.sectionLabel}>Chọn loại cảm biến thông dụng:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {SENSOR_PRESETS.map((preset, index) => {
                const isSelected = selectedPreset.type === preset.type;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.presetChip,
                      isSelected && { borderColor: preset.color, backgroundColor: `${preset.color}20` },
                    ]}
                    onPress={() => handleSelectPreset(preset)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={preset.icon}
                      size={18}
                      color={isSelected ? preset.color : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && { color: preset.color, fontWeight: '700' },
                      ]}
                    >
                      {preset.name.split(' (')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Form Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên cảm biến hiển thị</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="VD: Cảm biến Khí Gas MQ-2"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vị trí lắp đặt</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="VD: Nhà bếp, Sân sau, Phòng ngủ"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Đơn vị đo</Text>
                <TextInput
                  style={styles.textInput}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="ppm, lux, %, °C"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Dải đo (Max)</Text>
                <TextInput
                  style={styles.textInput}
                  value={max}
                  onChangeText={setMax}
                  keyboardType="numeric"
                  placeholder="1000"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Ngưỡng cảnh báo</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: 'rgba(245, 158, 11, 0.5)' }]}
                  value={warningThreshold}
                  onChangeText={setWarningThreshold}
                  keyboardType="numeric"
                  placeholder="300"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Ngưỡng nguy hiểm</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: 'rgba(239, 68, 68, 0.5)' }]}
                  value={dangerThreshold}
                  onChangeText={setDangerThreshold}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.hintBox}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
              <Text style={styles.hintText}>
                {selectedPreset.description || 'Cảm biến sau khi thêm sẽ lập tức bắt đầu hoạt động và ghi nhật ký cảnh báo tự động.'}
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.8}>
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
              <Text style={styles.submitBtnText}>Thêm vào hệ thống</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Nền làm mờ trong suốt nhẹ nhàng thay cho nền tối mịt
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.cardBg, // Nền trắng sáng tinh tế
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingTop: SIZES.lg,
    paddingHorizontal: SIZES.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SIZES.lg,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary, // Chữ tiêu đề tương phản cao
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2, // Loại bỏ wide letter spacing và all-caps
  },
  presetsRow: {
    flexDirection: 'row',
    marginBottom: SIZES.lg,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  presetChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#CBD5E1', // Viền slate-300 rõ nét dễ nhìn
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0F9FF', // Nền xanh pastel thông tin
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#0369A1', // Màu chữ xanh biển sâu dễ đọc đạt chuẩn WCAG
    flex: 1,
    lineHeight: 18,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radiusMd,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
