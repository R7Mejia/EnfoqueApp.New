import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export class AudioService {
  private static sound: Audio.Sound | null = null;
  private static isTestingSound = false;

  static async initializeAudio() {
    try {
      if (Platform.OS !== 'web') {
        // Configure audio mode for background playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true, // Keep audio active in background
          playsInSilentModeIOS: true, // Play even in silent mode
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });

        // Configure notifications for when screen is off
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permission not granted');
        }
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
          audio.volume = 0.8;
          audio.play().catch(() => {
            this.playSystemNotification();
          });
        } else {
          this.playSystemNotification();
        }
      } else {
        // Mobile audio handling with background support
        const source = soundUri 
          ? { uri: soundUri }
          : require('../assets/sounds/default-bell.mp3');

        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: true,
          volume: 0.8,
          isLooping: false,
        });
        
        this.sound = sound;
        
        // Set status to ensure it plays even when screen is off
        await sound.setStatusAsync({
          shouldPlay: true,
          volume: 0.8,
          progressUpdateIntervalMillis: 1000,
        });
        
        await sound.playAsync();

        // Also send a notification for screen-off scenarios
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '¡Enfoque! Focus Session Complete',
            body: 'Great job! Time for your reward activity.',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Show immediately
        });
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
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.5);
      } catch (error) {
        console.error('Error playing system notification:', error);
      }
    }
  }

  static async testSound(soundUri?: string) {
    try {
      this.isTestingSound = true;
      
      // Stop any currently playing sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      if (Platform.OS === 'web') {
        if (soundUri) {
          const audio = new window.Audio(soundUri);
          audio.volume = 0.8;
          audio.loop = true; // Loop for testing
          await audio.play();
          this.sound = audio as any; // Store reference for stopping
        } else {
          this.playSystemNotification();
        }
      } else {
        const source = soundUri 
          ? { uri: soundUri }
          : require('../assets/sounds/default-bell.mp3');

        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: true,
          volume: 0.8,
          isLooping: true, // Loop for testing
        });
        
        this.sound = sound;
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error testing sound:', error);
      this.isTestingSound = false;
      throw error;
    }
  }

  static async stopTestSound() {
    try {
      this.isTestingSound = false;
      if (this.sound) {
        if (Platform.OS === 'web') {
          // Web audio handling
          if (this.sound && typeof (this.sound as any).pause === 'function') {
            (this.sound as any).pause();
            (this.sound as any).currentTime = 0;
          }
        } else {
          // Mobile audio handling
          await this.sound.stopAsync();
          await this.sound.unloadAsync();
        }
        this.sound = null;
      }
    } catch (error) {
      console.error('Error stopping test sound:', error);
    }
  }

  static isCurrentlyTesting(): boolean {
    return this.isTestingSound;
  }

  static async cleanup() {
    try {
      this.isTestingSound = false;
      if (this.sound) {
        if (Platform.OS === 'web') {
          if (typeof (this.sound as any).pause === 'function') {
            (this.sound as any).pause();
          }
        } else {
          await this.sound.stopAsync();
          await this.sound.unloadAsync();
        }
        this.sound = null;
      }
    } catch (error) {
      console.error('Error cleaning up sound:', error);
    }
  }
}