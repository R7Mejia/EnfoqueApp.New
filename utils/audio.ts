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

  { id: 'notification', name: 'Notification Sound', isDefault: true },
];

export class AudioService {
  private static sound: Audio.Sound | null = null;
  private static isTestingSound = false;
  private static backgroundTimer: NodeJS.Timeout | null = null;

  static async initializeAudio() {
    try {
      console.log('🎵 Initializing AudioService...');

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
      console.log('🔊 AudioService.playSound called with:', soundOption);

      // Stop any currently playing sound
      if (this.sound) {
        try {
          await this.sound.unloadAsync();
          console.log('🛑 Previous sound unloaded');
        } catch (error) {
          console.log('⚠️ Error unloading previous sound:', error);
        }
        this.sound = null;
      }

      if (Platform.OS === 'web') {
        // Web-specific audio handling
        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          console.log('🌐 Playing custom sound on web:', soundOption.uri);
          try {
            const audio = new window.Audio(soundOption.uri);
            audio.volume = 1.0;
            audio.preload = 'auto';

            // Add event listeners for debugging
            audio.addEventListener('loadstart', () =>
              console.log('🌐 Audio loading started')
            );
            audio.addEventListener('canplay', () =>
              console.log('🌐 Audio can play')
            );
            audio.addEventListener('playing', () =>
              console.log('🌐 Audio is playing')
            );
            audio.addEventListener('ended', () =>
              console.log('🌐 Audio ended')
            );
            audio.addEventListener('error', (e) =>
              console.error('🌐 Audio error:', e)
            );

            await audio.play();
            console.log('✅ Custom sound played successfully on web');
          } catch (error) {
            console.error('❌ Web custom audio play error:', error);
            this.playSystemNotification();
          }
        } else {
          console.log('🌐 Playing system notification on web');
          this.playSystemNotification();
        }
      } else {
        // Mobile audio handling with background support
        let source;

        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          console.log('📱 Playing custom sound on mobile:', soundOption.uri);
          console.log('📱 Sound URI exists:', !!soundOption.uri);
          console.log('📱 Sound URI length:', soundOption.uri.length);
          source = { uri: soundOption.uri };
        } else {
          console.log('📱 Playing default sound on mobile');
          // Use default sound based on selection
          source = require('../assets/sounds/default-bell.mp3');
        }

        try {
          console.log('📱 Creating audio with source:', source);

          const { sound } = await Audio.Sound.createAsync(source, {
            shouldPlay: false, // Don't auto-play, we'll control it
            volume: 1.0,
            isLooping: false,
          });

          this.sound = sound;
          console.log('✅ Audio created successfully');

          // Set status and play
          await sound.setStatusAsync({
            shouldPlay: true,
            volume: 1.0,
            progressUpdateIntervalMillis: 1000,
          });

          const status = await sound.playAsync();
          console.log('📱 Sound play status:', status);
          console.log('✅ Custom sound played successfully on mobile');

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

          console.log('📱 Notification scheduled');
        } catch (audioError) {
          console.error('❌ Mobile audio creation/play error:', audioError);
          console.error('❌ Error details:', {
            message: audioError.message,
            code: audioError.code,
            stack: audioError.stack,
          });
          // Fallback to system notification
          this.playSystemNotification();
        }
      }
    } catch (error) {
      console.error('❌ Error in playSound:', error);
      this.playSystemNotification();
    }
  }

  static playSystemNotification() {
    console.log('🔔 Playing system notification');
    if (Platform.OS === 'web') {
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 1.5
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.5);
        console.log('✅ System notification played on web');
      } catch (error) {
        console.error('❌ Error playing system notification on web:', error);
      }
    } else {
      // For mobile, try to play a simple beep using Audio
      try {
        const beepSound = require('../assets/sounds/default-bell.mp3');
        Audio.Sound.createAsync(beepSound, { shouldPlay: true, volume: 1.0 })
          .then(({ sound }) => {
            sound.playAsync();
            console.log('✅ System notification played on mobile');
          })
          .catch((error) =>
            console.error('❌ Error playing mobile system notification:', error)
          );
      } catch (error) {
        console.error('❌ Error creating mobile system notification:', error);
      }
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
        const { sound } = await Audio.Sound.createAsync(
          { uri: soundOption.uri },
          { shouldPlay: false }
        );
        this.sound = sound;
      } else {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/default-bell.mp3'),
          { shouldPlay: false }
        );
        this.sound = sound;
      }
    } catch (error) {
      console.error('❌ Error preloading sound:', error);
    }
  }
}
