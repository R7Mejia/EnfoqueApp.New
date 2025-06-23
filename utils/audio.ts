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
        // CRITICAL: Configure audio mode for mobile with proper settings
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
      console.log('🔊 MOBILE AUDIO: Starting playSound with:', soundOption?.name);

      // CRITICAL: Stop any currently playing sound first
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
        // Web handling (simplified)
        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          try {
            const audio = new window.Audio(soundOption.uri);
            audio.volume = 1.0;
            await audio.play();
            console.log('✅ Web custom sound played');
            return;
          } catch (error) {
            console.error('❌ Web audio error:', error);
          }
        }
        this.playSystemNotification();
      } else {
        // MOBILE HANDLING - This is the critical part
        console.log('📱 MOBILE: Processing audio for mobile device');
        
        if (soundOption && !soundOption.isDefault && soundOption.uri) {
          console.log('📱 MOBILE: Custom sound detected:', soundOption.uri);
          
          try {
            // CRITICAL: Validate URI format for mobile
            const uri = soundOption.uri;
            console.log('📱 MOBILE: Validating URI:', uri);
            
            if (!uri || uri.length === 0) {
              throw new Error('Empty URI');
            }

            // CRITICAL: Create and configure audio for mobile
            console.log('📱 MOBILE: Creating Audio.Sound with URI');
            
            const { sound } = await Audio.Sound.createAsync(
              { uri: uri },
              {
                shouldPlay: false, // Don't auto-play, we'll control it
                volume: 1.0,
                isLooping: false,
                isMuted: false,
              },
              (status) => {
                // Status callback for debugging
                if (status.isLoaded) {
                  console.log('📱 MOBILE: Audio loaded successfully');
                } else if (status.error) {
                  console.error('📱 MOBILE: Audio load error:', status.error);
                }
              }
            );

            this.sound = sound;
            console.log('📱 MOBILE: Audio object created, now playing...');

            // CRITICAL: Play the sound
            const playbackStatus = await sound.playAsync();
            console.log('📱 MOBILE: Play command executed, status:', playbackStatus);

            if (playbackStatus.isLoaded) {
              console.log('✅ MOBILE: Custom sound is playing successfully!');
              
              // Send notification as backup
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: '¡Enfoque! Focus Session Complete',
                  body: 'Great job! Time for your reward activity.',
                  sound: false, // Don't play notification sound since we're playing custom
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null,
              });

              return; // SUCCESS - Exit here
            } else {
              throw new Error('Audio not loaded after play command');
            }

          } catch (mobileError) {
            console.error('❌ MOBILE: Custom audio failed:', mobileError);
            console.error('❌ MOBILE: Error details:', {
              message: mobileError.message,
              name: mobileError.name,
              stack: mobileError.stack,
            });
            
            // FALLBACK: Play system notification
            console.log('📱 MOBILE: Falling back to system notification');
            this.playSystemNotification();
            
            // Also send notification with sound
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '¡Enfoque! Focus Session Complete',
                body: 'Great job! Time for your reward activity.',
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: null,
            });
          }
        } else {
          // No custom sound, play default
          console.log('📱 MOBILE: No custom sound, playing system notification');
          this.playSystemNotification();
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '¡Enfoque! Focus Session Complete',
              body: 'Great job! Time for your reward activity.',
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
          });
        }
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in playSound:', error);
      this.playSystemNotification();
    }
  }

  static playSystemNotification() {
    console.log('🔔 Playing system notification');
    if (Platform.OS === 'web') {
      try {
        // Web beep sequence
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        
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
      // Mobile system beep
      try {
        console.log('📱 MOBILE: Creating system beep');
        
        // Create a simple beep using Audio API
        const createMobileBeep = async () => {
          try {
            // Use a simple data URI for a beep sound
            const beepUri = 'data:audio/wav;base64,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';
            
            const { sound } = await Audio.Sound.createAsync(
              { uri: beepUri },
              { shouldPlay: true, volume: 0.8 }
            );
            
            setTimeout(async () => {
              try {
                await sound.unloadAsync();
              } catch (e) {
                console.log('Error unloading beep sound:', e);
              }
            }, 1000);
          } catch (beepError) {
            console.error('📱 MOBILE: Error creating beep:', beepError);
            // Last resort - try vibration
            try {
              const { Vibration } = require('react-native');
              Vibration.vibrate([0, 500, 200, 500]);
              console.log('📱 MOBILE: Vibration fallback used');
            } catch (vibError) {
              console.error('📱 MOBILE: Error with vibration fallback:', vibError);
            }
          }
        };
        
        createMobileBeep();
        console.log('✅ System notification played on mobile');
      } catch (error) {
        console.error('❌ Error playing mobile system notification:', error);
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