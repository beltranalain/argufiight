/**
 * Haptic feedback utility
 * Provides haptic feedback for user actions
 */

// Note: expo-haptics may not be installed, handle gracefully
let HapticsModule: typeof import('expo-haptics') | null = null;
try {
  HapticsModule = require('expo-haptics');
} catch {
  // expo-haptics not available
}

export const haptics = {
  /**
   * Light impact feedback (for taps, selections)
   */
  light: () => {
    try {
      if (HapticsModule) {
        HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Haptics not available on this device
    }
  },

  /**
   * Medium impact feedback (for button presses)
   */
  medium: () => {
    try {
      if (HapticsModule) {
        HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      // Haptics not available on this device
    }
  },

  /**
   * Heavy impact feedback (for important actions)
   */
  heavy: () => {
    try {
      if (HapticsModule) {
        HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      // Haptics not available on this device
    }
  },

  /**
   * Success notification feedback
   */
  success: () => {
    try {
      if (HapticsModule) {
        HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Success);
      }
    } catch (error) {
      // Haptics not available on this device
    }
  },

  /**
   * Warning notification feedback
   */
  warning: () => {
    try {
      if (HapticsModule) {
        HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      // Haptics not available on this device
    }
  },

  /**
   * Error notification feedback
   */
  error: () => {
    try {
      if (HapticsModule) {
        HapticsModule.notificationAsync(HapticsModule.NotificationFeedbackType.Error);
      }
    } catch (error) {
      // Haptics not available on this device
    }
  },

  /**
   * Selection feedback (for pickers, switches)
   */
  selection: () => {
    try {
      if (HapticsModule) {
        HapticsModule.selectionAsync();
      }
    } catch (error) {
      // Haptics not available on this device
    }
  },
};

