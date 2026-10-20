import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
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
  const [activeTab, setActiveTab] = useState('Dashboard');
  const { alerts, gateState } = useIoT();

  const unreadAlerts = alerts.filter(a => a.type === 'danger' || a.type === 'warning').length;

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
      <StatusBar style="light" backgroundColor={COLORS.background} />

      {/* Main Content Area */}
      <View style={styles.contentArea}>{renderScreen()}</View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? COLORS.primaryLight : COLORS.textMuted}
                />
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
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  contentArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    ...SHADOWS.medium,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: COLORS.textMuted,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
