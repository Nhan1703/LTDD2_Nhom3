import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { IoTProvider, useIoT } from './src/context/IoTContext';
import { COLORS, SIZES, SHADOWS } from './src/constants/theme';

import DashboardScreen from './src/screens/DashboardScreen';
import GateScreen from './src/screens/GateScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

function MainApp() {
  // Trạng thái tab đang hoạt động (mặc định là Dashboard)
  const [activeTab, setActiveTab] = useState('Dashboard');
  const { alerts, gateState } = useIoT();

  // Đếm các cảnh báo nguy hiểm hoặc chú ý chưa xử lý
  const unreadAlerts = alerts.filter(a => a.type === 'danger' || a.type === 'warning').length;

  // Render màn hình tương ứng với tab đang chọn
  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen onNavigateTab={setActiveTab} />;
      case 'Gate':
        return <GateScreen />;
      case 'History':
        return <HistoryScreen />;
      case 'Alerts':
        return <AlertsScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen onNavigateTab={setActiveTab} />;
    }
  };

  // Cấu hình 5 tab điều hướng chính của hệ thống
  const tabs = [
    { key: 'Dashboard', label: 'Tổng quan', icon: 'home-outline', activeIcon: 'home' },
    {
      key: 'Gate',
      label: 'Cổng vào',
      icon: 'lock-closed-outline',
      activeIcon: 'lock-closed',
      badge: gateState.isOpen ? 'Mở' : null,
      badgeColor: COLORS.warning,
    },
    { key: 'History', label: 'Thống kê', icon: 'analytics-outline', activeIcon: 'analytics' },
    {
      key: 'Alerts',
      label: 'Cảnh báo',
      icon: 'notifications-outline',
      activeIcon: 'notifications',
      badge: unreadAlerts > 0 ? (unreadAlerts > 9 ? '9+' : String(unreadAlerts)) : null,
      badgeColor: COLORS.danger,
    },
    { key: 'Settings', label: 'Cài đặt', icon: 'settings-outline', activeIcon: 'settings' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />

      {/* Vùng hiển thị nội dung màn hình chính */}
      <View style={styles.contentArea}>{renderScreen()}</View>

      {/* Thanh điều hướng phía dưới (Bottom Navigation Bar) có container cân đối trên Web */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBarInner}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                {/* Vạch chỉ báo active tinh tế ở đỉnh mỗi tab */}
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: isActive ? COLORS.primary : 'transparent' },
                  ]}
                />

                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={23}
                    color={isActive ? COLORS.primary : COLORS.textMuted}
                  />
                  {/* Huy hiệu đếm cảnh báo hoặc trạng thái mở cổng */}
                  {tab.badge && (
                    <View style={[styles.tabBadge, { backgroundColor: tab.badgeColor || COLORS.danger }]}>
                      <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <IoTProvider>
      <MainApp />
    </IoTProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0,
  },
  contentArea: {
    flex: 1,
  },
  // Vỏ bọc ngoài của thanh menu dưới giúp nền trắng và đường viền luôn phủ kín chiều ngang
  tabBarWrapper: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  // Khung bên trong giới hạn bề rộng đúng 720px để cân xứng tuyệt đối với Header và nội dung ở giữa
  tabBarInner: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  activeIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 4,
  },
  iconContainer: {
    position: 'relative',
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: COLORS.textMuted,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.cardBg,
  },
  tabBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
