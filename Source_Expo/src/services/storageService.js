import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SENSORS: '@smart_iot_sensors',
  GATE: '@smart_iot_gate',
  ALERTS: '@smart_iot_alerts',
  SETTINGS: '@smart_iot_settings',
};

export const StorageService = {
  async saveSensors(sensors) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SENSORS, JSON.stringify(sensors));
    } catch (e) {
      console.warn('Error saving sensors to storage', e);
    }
  },

  async getSensors() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SENSORS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Error getting sensors from storage', e);
      return null;
    }
  },

  async saveGateState(gateState) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GATE, JSON.stringify(gateState));
    } catch (e) {
      console.warn('Error saving gate state to storage', e);
    }
  },

  async getGateState() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.GATE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Error getting gate state from storage', e);
      return null;
    }
  },

  async saveAlerts(alerts) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.warn('Error saving alerts to storage', e);
    }
  },

  async getAlerts() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Error getting alerts from storage', e);
      return null;
    }
  },

  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving settings to storage', e);
    }
  },

  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Error getting settings from storage', e);
      return null;
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Error clearing storage', e);
    }
  },
};
