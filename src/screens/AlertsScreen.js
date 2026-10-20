import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useIoT } from '../context/IoTContext';

export default function AlertsScreen() {
  const { alerts, clearAlerts, dismissAlert, triggerSimulationEvent } = useIoT();
  const [filter, setFilter] = useState('all'); // all | danger | warning | info

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.type === filter;
  });

  const confirmClearAll = () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Bạn có muốn xóa toàn bộ danh sách cảnh báo không?') : true;
      if (ok) {
        clearAlerts();
      }
    } else {
      Alert.alert(
        'Xóa lịch sử cảnh báo',
        'Bạn có muốn xóa toàn bộ danh sách cảnh báo không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xóa sạch', style: 'destructive', onPress: clearAlerts },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenSubtitle}>TRUNG TÂM AN NINH</Text>
          <Text style={styles.screenTitle}>Thông Báo & Cảnh Báo</Text>
        </View>

        {alerts.length > 0 && (
          <TouchableOpacity onPress={confirmClearAll} style={styles.clearAllBtn}>
            <Ionicons name="trash-bin-outline" size={16} color={COLORS.danger} />
            <Text style={styles.clearAllText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tất cả ({alerts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'danger' && styles.filterChipDanger]}
          onPress={() => setFilter('danger')}
        >
          <Text style={[styles.filterText, filter === 'danger' && styles.filterTextDanger]}>
            Báo động ({alerts.filter(a => a.type === 'danger').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'warning' && styles.filterChipWarning]}
          onPress={() => setFilter('warning')}
        >
          <Text style={[styles.filterText, filter === 'warning' && styles.filterTextWarning]}>
            Cảnh báo ({alerts.filter(a => a.type === 'warning').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Test Demo Section */}
      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>Thử nghiệm tình huống báo động tức thì:</Text>
        <View style={styles.demoButtonsRow}>
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => triggerSimulationEvent('water_leak')}
          >
            <Ionicons name="water" size={16} color={COLORS.water} />
            <Text style={styles.demoBtnText}>Rò rỉ nước</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => triggerSimulationEvent('loud_sound')}
          >
            <Ionicons name="volume-high" size={16} color={COLORS.sound} />
            <Text style={styles.demoBtnText}>Tiếng nổ / ồn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => triggerSimulationEvent('high_temp')}
          >
            <Ionicons name="flame" size={16} color={COLORS.temperature} />
            <Text style={styles.demoBtnText}>Quá nhiệt 40°</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="shield-checkmark-outline" size={54} color={COLORS.success} />
          <Text style={styles.emptyTitle}>Hệ thống hoàn toàn an toàn</Text>
          <Text style={styles.emptyDesc}>Hiện không có cảnh báo nguy hiểm nào được kích hoạt.</Text>
        </View>
      ) : (
        <View style={styles.alertsList}>
          {filteredAlerts.map(alert => {
            const isDanger = alert.type === 'danger';
            const isWarning = alert.type === 'warning';

            return (
              <View
                key={alert.id}
                style={[
                  styles.alertCard,
                  isDanger && styles.alertCardDanger,
                  isWarning && styles.alertCardWarning,
                ]}
              >
                <View
                  style={[
                    styles.alertIconCircle,
                    {
                      backgroundColor: isDanger
                        ? 'rgba(239, 68, 68, 0.2)'
                        : isWarning
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(37, 99, 235, 0.2)',
                    },
                  ]}
                >
                  <Ionicons
                    name={isDanger ? 'alert-circle' : isWarning ? 'warning' : 'information-circle'}
                    size={22}
                    color={isDanger ? COLORS.danger : isWarning ? COLORS.warning : COLORS.primaryLight}
                  />
                </View>

                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle} numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text style={styles.alertTime}>{alert.time}</Text>
                  </View>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => dismissAlert(alert.id)}
                  style={styles.dismissBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusSm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SIZES.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  filterChipDanger: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  filterChipWarning: {
    borderColor: COLORS.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  filterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  filterTextDanger: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  filterTextWarning: {
    color: COLORS.warning,
    fontWeight: '700',
  },
  demoCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: SIZES.radiusMd,
    padding: 12,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 14,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  alertsList: {
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radiusMd,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    gap: 10,
  },
  alertCardDanger: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  alertCardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  alertTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  alertMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  dismissBtn: {
    padding: 4,
  },
});
