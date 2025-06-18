import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export class AudioService {
  private static sound: Audio.Sound | null = null;

  static async initializeAudio() {
    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true, // Allow audio to play when screen is off
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  static async playSound(soundUri?: string) {
    try {
      // Stop any currently playing sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      if (Platform.OS === 'web') {
        // Web-specific audio handling
        if (soundUri) {
          const audio = new window.Audio(soundUri);
          audio.volume = 0.7;
          audio.play().catch(() => {
            this.playSystemNotification();
          });
        } else {
          this.playSystemNotification();
        }
      } else {
        // Mobile audio handling
        const source = soundUri 
          ? { uri: soundUri }
          : require('../assets/sounds/default-bell.mp3');

        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: true,
          volume: 0.7,
        });
        this.sound = sound;
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      // Fallback to system notification if custom sound fails
      this.playSystemNotification();
    }
  }

  static playSystemNotification() {
    if (Platform.OS === 'web') {
      // Web fallback - create a simple beep
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      } catch (error) {
        console.error('Error playing system notification:', error);
      }
    }
  }

  static async testSound(soundUri?: string) {
    await this.playSound(soundUri);
  }

  static async cleanup() {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      } catch (error) {
        console.error('Error cleaning up sound:', error);
      }
    }
  }
}