import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface SoundOption {
  id: string;
  name: string;
  uri?: string;
  isDefault: boolean;
}

export const DEFAULT_SOUNDS: SoundOption[] = [
  { id: 'bell', name: 'Default Bell', isDefault: true },
  { id: 'chime', name: 'Gentle Chime', isDefault: true },
  { id: 'ding', name: 'Simple Ding', isDefault: true },
  { id: 'notification', name: 'Notification Sound', isDefault: true },
];

export class AudioService {
  private static sound: Audio.Sound | null = null;
  private static isTestingSound = false;
  private static backgroundTimer: NodeJS.Timeout | null = null;

  static async initializeAudio() {
    try {
      if (Platform.OS !== 'web') {
        // Configure audio mode for background playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });

        // Configure notifications
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

  static async playSound(soundOption?: SoundOption) {
    try {
      console.log('Playing sound:', soundOption);
      
      // Stop any currently playing sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      if (Platform.OS === 'web') {
        // Web-specific audio handling
        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          console.log('Playing custom sound on web:', soundOption.uri);
          const audio = new window.Audio(soundOption.uri);
          audio.volume = 0.8;
          audio.play().catch((error) => {
            console.error('Web audio play error:', error);
            this.playSystemNotification();
          });
        } else {
          console.log('Playing system notification on web');
          this.playSystemNotification();
        }
      } else {
        // Mobile audio handling with background support
        let source;
        
        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          console.log('Playing custom sound on mobile:', soundOption.uri);
          source = { uri: soundOption.uri };
        } else {
          console.log('Playing default sound on mobile');
          // Use default sound based on selection
          source = require('../assets/sounds/default-bell.mp3');
        }

        try {
          const { sound } = await Audio.Sound.createAsync(source, {
            shouldPlay: true,
            volume: 1.0, // Increased volume
            isLooping: false,
          });
          
          this.sound = sound;
          
          // Set status to ensure it plays even when screen is off
          await sound.setStatusAsync({
            shouldPlay: true,
            volume: 1.0, // Increased volume
            progressUpdateIntervalMillis: 1000,
          });
          
          await sound.playAsync();
          console.log('Sound played successfully');

          // Send notification for screen-off scenarios
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '¡Enfoque! Focus Session Complete',
              body: 'Great job! Time for your reward activity.',
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
          });
        } catch (audioError) {
          console.error('Audio creation/play error:', audioError);
          // Fallback to system notification
          this.playSystemNotification();
        }
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      this.playSystemNotification();
    }
  }

  static playSystemNotification() {
    console.log('Playing system notification');
    if (Platform.OS === 'web') {
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
    } else {
      // For mobile, try to play a simple beep using Audio
      try {
        const beepSound = require('../assets/sounds/default-bell.mp3');
        Audio.Sound.createAsync(beepSound, { shouldPlay: true, volume: 1.0 })
          .then(({ sound }) => {
            sound.playAsync();
          })
          .catch(console.error);
      } catch (error) {
        console.error('Error playing mobile system notification:', error);
      }
    }
  }

  static async testSound(soundOption?: SoundOption) {
    try {
      this.isTestingSound = true;
      console.log('Testing sound:', soundOption);
      
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      if (Platform.OS === 'web') {
        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          const audio = new window.Audio(soundOption.uri);
          audio.volume = 0.8;
          audio.loop = true;
          await audio.play();
          this.sound = audio as any;
        } else {
          this.playSystemNotification();
        }
      } else {
        let source;
        
        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          source = { uri: soundOption.uri };
        } else {
          source = require('../assets/sounds/default-bell.mp3');
        }

        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: true,
          volume: 0.8,
          isLooping: true,
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
          if (this.sound && typeof (this.sound as any).pause === 'function') {
            (this.sound as any).pause();
            (this.sound as any).currentTime = 0;
          }
        } else {
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

  // Background timer functionality
  static startBackgroundTimer(duration: number, onComplete: () => void) {
    if (Platform.OS !== 'web') {
      // For mobile, use background task
      this.backgroundTimer = setInterval(() => {
        // This will keep running even when screen is off
        duration--;
        if (duration <= 0) {
          this.stopBackgroundTimer();
          onComplete();
        }
      }, 1000);
    }
  }

  static stopBackgroundTimer() {
    if (this.backgroundTimer) {
      clearInterval(this.backgroundTimer);
      this.backgroundTimer = null;
    }
  }

  static async cleanup() {
    try {
      this.isTestingSound = false;
      this.stopBackgroundTimer();
      
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