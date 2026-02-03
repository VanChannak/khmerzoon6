import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Trigger light haptic feedback for menu selections
 */
export const triggerSelectionHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Haptics not available, ignore silently
    }
  }
};

/**
 * Trigger medium haptic feedback for toggle switches
 */
export const triggerToggleHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Haptics not available, ignore silently
    }
  }
};
