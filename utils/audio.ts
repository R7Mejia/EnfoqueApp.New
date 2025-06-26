import { Audio } from 'expo-av';
import { Platform, Vibration, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface SoundOption {
  id: string;
  name: string;
  uri?: string;
  isDefault: boolean;
}

// Default sounds that work across platforms
export const DEFAULT_SOUNDS: SoundOption[] = [
  {
    id: 'default_bell',
    name: 'Default Bell',
    isDefault: true,
  },
  {
    id: 'default_chime',
    name: 'Default Chime',
    isDefault: true,
  },
];

export class AudioService {
  private static sound: Audio.Sound | null = null;
  private static isTestingSound = false;
  private static backgroundTimer: NodeJS.Timeout | null = null;

  static async initializeAudio() {
    try {
      console.log('🎵 Initializing AudioService...');

      if (Platform.OS !== 'web') {
        // CRITICAL: Configure audio mode for mobile with proper settings
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: 1, // DoNotMix
          interruptionModeAndroid: 1, // DoNotMix
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
          console.warn('⚠️ Notification permission not granted');
        }
      }

      console.log('✅ AudioService initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing audio:', error);
    }
  }

  static async playSound(soundOption?: SoundOption) {
    try {
      console.log(
        '🔊 AUDIO: Starting playSound with:',
        soundOption?.name,
        soundOption?.uri
      );

      // Stop any currently playing sound first
      if (this.sound) {
        try {
          await this.sound.unloadAsync();
          console.log('🛑 Previous sound unloaded');
        } catch (error) {
          console.log('⚠️ Error unloading previous sound:', error);
        }
        this.sound = null;
      }

      if (soundOption && soundOption.uri) {
        let uri = soundOption.uri;
        // If on mobile and the URI is not a remote URL, ensure it has file://
        if (
          Platform.OS !== 'web' &&
          !uri.startsWith('http') &&
          !uri.startsWith('file://')
        ) {
          uri = 'file://' + uri;
        }
        console.log('🔊 Attempting to play URI:', uri);
        try {
          if (Platform.OS === 'web') {
            const audio = new window.Audio(uri);
            audio.volume = 1.0;
            await audio.play();
            console.log('✅ Web custom sound played');
            return;
          } else {
            // Check file existence before playing
            const FileSystem = require('@/utils/fileSystemProxy').default;
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists) {
              throw new Error('Audio file does not exist at URI: ' + uri);
            }
            const { sound } = await Audio.Sound.createAsync(
              { uri },
              {
                shouldPlay: true,
                volume: 1.0,
                isLooping: false,
                isMuted: false,
              }
            );
            this.sound = sound;
            console.log('✅ Mobile custom sound played');
            return;
          }
        } catch (error) {
          console.error('❌ Error playing custom sound:', error, 'URI:', uri);
          if (Platform.OS !== 'web') {
            Alert.alert(
              'Audio Error',
              'Could not play your custom sound. Please try re-uploading or pick a different file.'
            );
          }
          // Fallback: vibration only
          try {
            Vibration.vibrate([0, 500, 200, 500]);
            console.log('📱 Vibration fallback used');
          } catch (vibError) {
            console.error('📱 Error with vibration fallback:', vibError);
          }
        }
      } else {
        // No valid custom sound, fallback to vibration
        try {
          Vibration.vibrate([0, 500, 200, 500]);
          console.log('📱 Vibration fallback used');
        } catch (vibError) {
          console.error('📱 Error with vibration fallback:', vibError);
        }
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in playSound:', error);
    }
  }

  static async testSound(soundOption?: SoundOption) {
    try {
      this.isTestingSound = true;
      console.log('🧪 Testing sound:', soundOption);

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
        }
      } else {
        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: soundOption.uri },
            {
              shouldPlay: true,
              volume: 0.8,
              isLooping: true,
            }
          );
          this.sound = sound;
        }
      }
    } catch (error) {
      console.error('❌ Error testing sound:', error);
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
      console.error('❌ Error stopping test sound:', error);
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
      console.error('❌ Error cleaning up sound:', error);
    }
  }

  // Preload a sound for instant playback
  static async preloadSound(soundOption?: SoundOption) {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      if (soundOption && !soundOption.isDefault && soundOption.uri) {
        console.log('🔄 Preloading custom sound:', soundOption.uri);
        const { sound } = await Audio.Sound.createAsync(
          { uri: soundOption.uri },
          { shouldPlay: false }
        );
        this.sound = sound;
        console.log('✅ Custom sound preloaded');
      }
    } catch (error) {
      console.error('❌ Error preloading sound:', error);
    }
  }
}
