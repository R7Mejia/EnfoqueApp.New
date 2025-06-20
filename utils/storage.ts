import AsyncStorage from '@react-native-async-storage/async-storage';
import { SoundOption } from './audio';

const STORAGE_KEYS = {
  ACTIVITIES: 'enfoque_activities',
  CUSTOM_SOUNDS: 'enfoque_custom_sounds',
  SELECTED_SOUND: 'enfoque_selected_sound',
  BACKGROUND_IMAGE: 'enfoque_background_image',
  TIMER_STATE: 'enfoque_timer_state',
  LANGUAGE: 'enfoque_language',
  CUSTOM_CATEGORIES: 'enfoque_custom_categories',
};

export interface Activity {
  id: string;
  name: string;
  category: string;
  emoji: string;
  createdAt: number;
}

export interface CustomCategory {
  id: string;
  name: string;
  emoji: string;
  isDefault: boolean;
  createdAt: number;
}

export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'recreation', name: 'Recreation', emoji: '🎮', isDefault: true, createdAt: 0 },
  { id: 'exercise', name: 'Exercise', emoji: '💪', isDefault: true, createdAt: 0 },
  { id: 'creative', name: 'Creative', emoji: '🎨', isDefault: true, createdAt: 0 },
  { id: 'social', name: 'Social', emoji: '👥', isDefault: true, createdAt: 0 },
  { id: 'relaxation', name: 'Relaxation', emoji: '🧘', isDefault: true, createdAt: 0 },
  { id: 'learning', name: 'Learning', emoji: '📚', isDefault: true, createdAt: 0 },
  { id: 'music', name: 'Music', emoji: '🎵', isDefault: true, createdAt: 0 },
  { id: 'outdoor', name: 'Outdoor', emoji: '🌳', isDefault: true, createdAt: 0 },
  { id: 'food', name: 'Food & Drink', emoji: '🍕', isDefault: true, createdAt: 0 },
  { id: 'other', name: 'Other', emoji: '✨', isDefault: true, createdAt: 0 },
];

// Legacy support - convert to new format
export const ActivityCategories = DEFAULT_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = { name: cat.name, emoji: cat.emoji };
  return acc;
}, {} as Record<string, { name: string; emoji: string }>);

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

  // Custom Categories
  async getCustomCategories(): Promise<CustomCategory[]> {
    try {
      const categories = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
      return categories ? JSON.parse(categories) : [];
    } catch (error) {
      console.error('Error getting custom categories:', error);
      return [];
    }
  },

  async saveCustomCategories(categories: CustomCategory[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving custom categories:', error);
    }
  },

  async addCustomCategory(category: CustomCategory): Promise<void> {
    try {
      const existingCategories = await this.getCustomCategories();
      const updatedCategories = [...existingCategories, category];
      await this.saveCustomCategories(updatedCategories);
    } catch (error) {
      console.error('Error adding custom category:', error);
    }
  },

  async removeCustomCategory(categoryId: string): Promise<void> {
    try {
      const existingCategories = await this.getCustomCategories();
      const updatedCategories = existingCategories.filter(cat => cat.id !== categoryId);
      await this.saveCustomCategories(updatedCategories);
    } catch (error) {
      console.error('Error removing custom category:', error);
    }
  },

  async getAllCategories(): Promise<CustomCategory[]> {
    try {
      const customCategories = await this.getCustomCategories();
      return [...DEFAULT_CATEGORIES, ...customCategories];
    } catch (error) {
      console.error('Error getting all categories:', error);
      return DEFAULT_CATEGORIES;
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