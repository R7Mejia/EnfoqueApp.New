import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import {
  Upload,
  Volume2,
  Trash2,
  Image as ImageIcon,
  Square,
  Globe,
  Play,
  Pause,
  ChevronDown,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { StorageService } from '@/utils/storage';
import { AudioService, SoundOption, DEFAULT_SOUNDS } from '@/utils/audio';
import { getTranslation } from '@/utils/translations';
import FileSystem from '@/utils/fileSystemProxy';

function SettingsScreen() {
  const [customSounds, setCustomSounds] = useState<SoundOption[]>([]);
  const [selectedSound, setSelectedSound] = useState<SoundOption | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showSoundDropdown, setShowSoundDropdown] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'zh', name: '中文' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [sounds, selected, image, language] = await Promise.all([
        StorageService.getCustomSounds(),
        StorageService.getSelectedSound(),
        StorageService.getBackgroundImage(),
        StorageService.getLanguage(),
      ]);

      setCustomSounds(sounds);
      setSelectedSound(selected || DEFAULT_SOUNDS[0]);
      setBackgroundImage(image);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const t = (key: string) => getTranslation(currentLanguage, key);

  const changeLanguage = async (languageCode: string) => {
    try {
      await StorageService.saveLanguage(languageCode);
      setCurrentLanguage(languageCode);

      if (Platform.OS === 'web') {
        alert(
          `${getTranslation(languageCode, 'success')}\n\n${getTranslation(
            languageCode,
            'languageChanged'
          )}`
        );
      } else {
        Alert.alert(
          getTranslation(languageCode, 'success'),
          getTranslation(languageCode, 'languageChanged')
        );
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const pickSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        let uri = asset.uri;
        // Normalize URI for mobile
        if (Platform.OS !== 'web') {
          if (uri.startsWith('content://')) {
            // Try to get a file path from content URI
            try {
              const fileInfo = await FileSystem.getInfoAsync(uri);
              if (fileInfo.exists && fileInfo.uri) {
                uri = fileInfo.uri;
              }
            } catch (e) {
              console.warn('Could not resolve content URI, using as-is:', uri);
            }
          } else if (!uri.startsWith('file://')) {
            uri = 'file://' + uri;
          }
        }
        const newSound: SoundOption = {
          id: `custom_${Date.now()}`,
          name: asset.name,
          uri,
          isDefault: false,
        };
        await StorageService.addCustomSound(newSound);
        setCustomSounds((prev) => [...prev, newSound]);
        if (Platform.OS === 'web') {
          alert(`${t('success')}\n\n${t('soundUploaded')}`);
        } else {
          Alert.alert(t('success'), t('soundUploaded'));
        }
      }
    } catch (error) {
      console.error('Error picking sound:', error);
      if (Platform.OS === 'web') {
        alert(`${t('error')}\n\n${t('uploadError')}`);
      } else {
        Alert.alert(t('error'), t('uploadError'));
      }
    }
  };

  const removeCustomSound = async (soundId: string) => {
    const confirmRemove = async () => {
      await StorageService.removeCustomSound(soundId);
      setCustomSounds((prev) => prev.filter((sound) => sound.id !== soundId));

      // If the removed sound was selected, reset to default
      if (selectedSound?.id === soundId) {
        const defaultSound = DEFAULT_SOUNDS[0];
        setSelectedSound(defaultSound);
        await StorageService.saveSelectedSound(defaultSound);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(t('removeSoundMessage'))) {
        confirmRemove();
      }
    } else {
      Alert.alert(t('removeSound'), t('removeSoundMessage'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: confirmRemove,
        },
      ]);
    }
  };

  const selectSound = async (sound: SoundOption) => {
    setSelectedSound(sound);
    await StorageService.saveSelectedSound(sound);
    setShowSoundDropdown(false);
  };

  const testSound = async (sound: SoundOption) => {
    try {
      setIsTestingSound(true);
      await AudioService.testSound(sound);
    } catch (error) {
      console.error('Error testing sound:', error);
      setIsTestingSound(false);
      if (Platform.OS === 'web') {
        alert(`${t('error')}\n\n${t('soundError')}`);
      } else {
        Alert.alert(t('error'), t('soundError'));
      }
    }
  };

  const stopTestSound = async () => {
    try {
      await AudioService.stopTestSound();
      setIsTestingSound(false);
    } catch (error) {
      console.error('Error stopping sound:', error);
      setIsTestingSound(false);
    }
  };

  const pickBackgroundImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert(
            'Permission Required',
            'Permission to access camera roll is required!'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await StorageService.saveBackgroundImage(asset.uri);
        setBackgroundImage(asset.uri);

        if (Platform.OS === 'web') {
          alert(`${t('success')}\n\n${t('backgroundUpdated')}`);
        } else {
          Alert.alert(t('success'), t('backgroundUpdated'));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS === 'web') {
        alert(`${t('error')}\n\n${t('uploadError')}`);
      } else {
        Alert.alert(t('error'), t('uploadError'));
      }
    }
  };

  const removeBackgroundImage = async () => {
    const confirmRemove = async () => {
      await StorageService.removeBackgroundImage();
      setBackgroundImage(null);
    };

    if (Platform.OS === 'web') {
      if (confirm(t('removeBackgroundMessage'))) {
        confirmRemove();
      }
    } else {
      Alert.alert(t('removeBackground'), t('removeBackgroundMessage'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: confirmRemove,
        },
      ]);
    }
  };

  const allSounds = [...DEFAULT_SOUNDS, ...customSounds];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settingsTitle')}</Text>
        <Text style={styles.subtitle}>{t('customizeExperience')}</Text>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <Text style={styles.sectionDescription}>{t('languageDesc')}</Text>

        <View style={styles.languageOptions}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                currentLanguage === language.code &&
                  styles.selectedLanguageOption,
              ]}
              onPress={() => changeLanguage(language.code)}
            >
              <Globe
                size={20}
                color={
                  currentLanguage === language.code ? '#7C3AED' : '#6B7280'
                }
              />
              <Text
                style={[
                  styles.languageOptionText,
                  currentLanguage === language.code &&
                    styles.selectedLanguageText,
                ]}
              >
                {language.name}
              </Text>
              {currentLanguage === language.code && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Background Image Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('backgroundImage')}</Text>
        <Text style={styles.sectionDescription}>
          {t('backgroundImageDesc')}
        </Text>

        {backgroundImage && (
          <View style={styles.currentBackground}>
            <Image
              source={{ uri: backgroundImage }}
              style={styles.backgroundPreview}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={removeBackgroundImage}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.backgroundButton}
          onPress={pickBackgroundImage}
        >
          <ImageIcon size={20} color="#7C3AED" />
          <Text style={styles.backgroundButtonText}>
            {backgroundImage ? t('changeBackground') : t('chooseBackground')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timer Sound Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('timerSound')}</Text>
        <Text style={styles.sectionDescription}>{t('timerSoundDesc')}</Text>

        {/* Sound Selector Dropdown */}
        <View style={styles.soundSelector}>
          <TouchableOpacity
            style={styles.soundDropdownButton}
            onPress={() => setShowSoundDropdown(!showSoundDropdown)}
          >
            <Volume2 size={20} color="#7C3AED" />
            <Text style={styles.soundDropdownText}>
              {selectedSound?.name || 'Select Sound'}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          {showSoundDropdown && (
            <View style={styles.soundDropdown}>
              {allSounds.map((sound) => (
                <View key={sound.id} style={styles.soundOption}>
                  <TouchableOpacity
                    style={[
                      styles.soundOptionButton,
                      selectedSound?.id === sound.id &&
                        styles.selectedSoundOption,
                    ]}
                    onPress={() => selectSound(sound)}
                  >
                    <Text
                      style={[
                        styles.soundOptionText,
                        selectedSound?.id === sound.id &&
                          styles.selectedSoundText,
                      ]}
                    >
                      {sound.name}
                    </Text>
                    {selectedSound?.id === sound.id && (
                      <View style={styles.selectedIndicator} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.soundControls}>
                    <TouchableOpacity
                      style={[
                        styles.testButton,
                        isTestingSound && styles.testButtonActive,
                      ]}
                      onPress={() =>
                        isTestingSound ? stopTestSound() : testSound(sound)
                      }
                    >
                      {isTestingSound ? (
                        <Pause size={16} color="#EF4444" />
                      ) : (
                        <Play size={16} color="#7C3AED" />
                      )}
                    </TouchableOpacity>

                    {!sound.isDefault && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeCustomSound(sound.id)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Add Custom Sound */}
        <View style={styles.customSoundSection}>
          <Text style={styles.customSoundTitle}>{t('customSound')}</Text>
          <Text style={styles.customSoundDescription}>
            {t('customSoundDesc')}
          </Text>

          <TouchableOpacity style={styles.uploadButton} onPress={pickSound}>
            <Upload size={20} color="#7C3AED" />
            <Text style={styles.uploadButtonText}>{t('uploadSound')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ADHD Tips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('adhdFeatures')}</Text>
        <Text style={styles.sectionDescription}>{t('adhdFeaturesDesc')}</Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>{t('flexibleDurations')}</Text>
            <Text style={styles.featureDescription}>
              {t('flexibleDurationsDesc')}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>{t('screenOffAlerts')}</Text>
            <Text style={styles.featureDescription}>
              {t('screenOffAlertsDesc')}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>{t('rewardSystem')}</Text>
            <Text style={styles.featureDescription}>
              {t('rewardSystemDesc')}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>
              {t('personalCustomization')}
            </Text>
            <Text style={styles.featureDescription}>
              {t('personalCustomizationDesc')}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#7C3AED',
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguageOption: {
    backgroundColor: '#F3F4F6',
    borderColor: '#7C3AED',
  },
  languageOptionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  selectedLanguageText: {
    color: '#7C3AED',
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  currentBackground: {
    position: 'relative',
    marginBottom: 16,
  },
  backgroundPreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backgroundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  backgroundButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#7C3AED',
  },
  soundSelector: {
    marginBottom: 20,
  },
  soundDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  soundDropdownText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  soundDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  soundOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectedSoundOption: {
    backgroundColor: '#F8FAFC',
  },
  soundOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  selectedSoundText: {
    color: '#7C3AED',
    fontFamily: 'Inter-SemiBold',
  },
  soundControls: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  testButtonActive: {
    backgroundColor: '#FEF2F2',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  customSoundSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
  },
  customSoundTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  customSoundDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#7C3AED',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    paddingVertical: 8,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    paddingLeft: 16,
  },
});

export default SettingsScreen;
