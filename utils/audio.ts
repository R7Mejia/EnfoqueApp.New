import { Audio } from 'expo-av';
import { Platform } from 'react-native';
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
            return; // Exit early on success
          } catch (error) {
            console.error('❌ Web custom audio play error:', error);
            // Fall through to system notification
          }
        }
        
        console.log('🌐 Playing system notification on web');
        this.playSystemNotification();
      } else {
        // Mobile audio handling
        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          console.log('📱 Attempting to play custom sound on mobile:', soundOption.uri);
          console.log('📱 Sound URI exists:', !!soundOption.uri);
          console.log('📱 Sound URI length:', soundOption.uri.length);
          
          try {
            // Validate URI format
            if (!soundOption.uri.startsWith('file://') && !soundOption.uri.startsWith('content://') && !soundOption.uri.startsWith('http')) {
              throw new Error('Invalid URI format: ' + soundOption.uri);
            }

            console.log('📱 Creating audio with custom URI:', soundOption.uri);

            const { sound } = await Audio.Sound.createAsync(
              { uri: soundOption.uri },
              {
                shouldPlay: false,
                volume: 1.0,
                isLooping: false,
              }
            );

            this.sound = sound;
            console.log('✅ Custom audio created successfully');

            // Play the sound
            await sound.playAsync();
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
            return; // Exit early on success
          } catch (audioError) {
            console.error('❌ Mobile custom audio error:', audioError);
            console.error('❌ Error details:', {
              message: audioError.message,
              code: audioError.code,
              stack: audioError.stack,
            });
            // Fall through to system notification
          }
        }

        console.log('📱 Playing system notification on mobile');
        this.playSystemNotification();
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
        // Create a more distinctive beep sound for web
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        
        // Create a sequence of beeps
        const frequencies = [800, 1000, 800];
        let startTime = audioContext.currentTime;
        
        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = freq;
          oscillator.type = 'sine';

          const beepStart = startTime + (index * 0.3);
          const beepEnd = beepStart + 0.2;

          gainNode.gain.setValueAtTime(0, beepStart);
          gainNode.gain.linearRampToValueAtTime(0.3, beepStart + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, beepEnd);

          oscillator.start(beepStart);
          oscillator.stop(beepEnd);
        });
        
        console.log('✅ System notification played on web');
      } catch (error) {
        console.error('❌ Error playing system notification on web:', error);
      }
    } else {
      // For mobile, create a simple beep using oscillator
      try {
        // Create a simple notification sound
        const createBeep = async () => {
          const { sound } = await Audio.Sound.createAsync(
            {
              uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
            },
            { shouldPlay: true, volume: 0.8 }
          );
          
          setTimeout(async () => {
            try {
              await sound.unloadAsync();
            } catch (e) {
              console.log('Error unloading beep sound:', e);
            }
          }, 1000);
        };
        
        createBeep();
        console.log('✅ System notification played on mobile');
      } catch (error) {
        console.error('❌ Error playing mobile system notification:', error);
        // Last resort - try vibration
        try {
          const { Vibration } = require('react-native');
          Vibration.vibrate([0, 500, 200, 500]);
        } catch (vibError) {
          console.error('❌ Error with vibration fallback:', vibError);
        }
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
        } else {
          this.playSystemNotification();
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