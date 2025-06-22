import { Vibration, Platform } from 'react-native';

export function vibrateOnComplete() {
  if (Platform.OS !== 'web') {
    // Vibrate for 500ms on mobile
    Vibration.vibrate(500);
  }
}
