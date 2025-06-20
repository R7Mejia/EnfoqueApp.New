import AsyncStorage from '@react-native-async-storage/async-storage';
import { SoundOption } from './audio';

const STORAGE_KEYS = {
  ACTIVITIES: 'enfoque_activities',
  CUSTOM_SOUNDS: 'enfoque_custom_sounds',
  SELECTED_SOUND: 'enfoque_selected_sound',
  BACKGROUND_IMAGE: 'enfoque_background_image',
  TIMER_STATE: 'enfoque_timer_state',
  LANGUAGE: 'enfoque_language',
};

export interface Activity {
  id: string;
  name: string;
  category: string;
  emoji: string;
  createdAt: number;
}

export const ActivityCategories = {
  recreation: { name: 'Recreation', emoji: '🎮' },
  exercise: { name: 'Exercise', emoji: '💪' },
  creative: { name: 'Creative', emoji: '🎨' },
  social: { name: 'Social', emoji: '👥' },
  relaxation: { name: 'Relaxation', emoji: '🧘' },
  learning: { name: 'Learning', emoji: '📚' },
  music: { name: 'Music', emoji: '🎵' },
  outdoor: { name: 'Outdoor', emoji: '🌳' },
  food: { name: 'Food & Drink', emoji: '🍕' },
  other: { name: 'Other', emoji: '✨' },
};

export const StorageService = {
  // Activities
  async getActivities(): Promise<Activity[]> {
    try {
      const activities = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (activities) {
        const parsed = JSON.parse(activities);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          const converted: Activity[] = parsed.map((name: string, index: number) => ({
            id: `legacy_${index}_${Date.now()}`,
            name,
            category: 'other',
            emoji: '✨',
            createdAt: Date.now() - (parsed.length - index) * 1000,
          }));
          await this.saveActivities(converted);
          return converted;
        }
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  },

  async saveActivities(activities: Activity[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  },

  // Custom Sounds
  async getCustomSounds(): Promise<SoundOption[]> {
    try {
      const sounds = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_SOUNDS);
      return sounds ? JSON.parse(sounds) : [];
    } catch (error) {
      console.error('Error getting custom sounds:', error);
      return [];
    }
  },

  async saveCustomSounds(sounds: SoundOption[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_SOUNDS, JSON.stringify(sounds));
    } catch (error) {
      console.error('Error saving custom sounds:', error);
    }
  },

  async addCustomSound(sound: SoundOption): Promise<void> {
    try {
      const existingSounds = await this.getCustomSounds();
      const updatedSounds = [...existingSounds, sound];
      await this.saveCustomSounds(updatedSounds);
    } catch (error) {
      console.error('Error adding custom sound:', error);
    }
  },

  async removeCustomSound(soundId: string): Promise<void> {
    try {
      const existingSounds = await this.getCustomSounds();
      const updatedSounds = existingSounds.filter(sound => sound.id !== soundId);
      await this.saveCustomSounds(updatedSounds);
    } catch (error) {
      console.error('Error removing custom sound:', error);
    }
  },

  // Selected Sound
  async getSelectedSound(): Promise<SoundOption | null> {
    try {
      const sound = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_SOUND);
      return sound ? JSON.parse(sound) : null;
    } catch (error) {
      console.error('Error getting selected sound:', error);
      return null;
    }
  },

  async saveSelectedSound(sound: SoundOption): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_SOUND, JSON.stringify(sound));
    } catch (error) {
      console.error('Error saving selected sound:', error);
    }
  },

  // Legacy support
  async getCustomSound(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('enfoque_custom_sound');
    } catch (error) {
      console.error('Error getting legacy custom sound:', error);
      return null;
    }
  },

  async saveCustomSound(soundUri: string): Promise<void> {
    try {
      await AsyncStorage.setItem('enfoque_custom_sound', soundUri);
    } catch (error) {
      console.error('Error saving legacy custom sound:', error);
    }
  },

  async removeCustomSound(): Promise<void> {
    try {
      await AsyncStorage.removeItem('enfoque_custom_sound');
    } catch (error) {
      console.error('Error removing legacy custom sound:', error);
    }
  },

  // Background Image
  async getBackgroundImage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND_IMAGE);
    } catch (error) {
      console.error('Error getting background image:', error);
      return null;
    }
  },

  async saveBackgroundImage(imageUri: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_IMAGE, imageUri);
    } catch (error) {
      console.error('Error saving background image:', error);
    }
  },

  async removeBackgroundImage(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.BACKGROUND_IMAGE);
    } catch (error) {
      console.error('Error removing background image:', error);
    }
  },

  // Language
  async getLanguage(): Promise<string> {
    try {
      const language = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      return language || 'en';
    } catch (error) {
      console.error('Error getting language:', error);
      return 'en';
    }
  },

  async saveLanguage(language: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },

  // Timer State
  async getTimerState(): Promise<any> {
    try {
      const state = await AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Error getting timer state:', error);
      return null;
    }
  },

  async saveTimerState(state: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  },

  async clearTimerState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
  },
};