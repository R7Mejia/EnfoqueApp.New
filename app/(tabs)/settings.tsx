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
import { Upload, Volume2, Trash2, Image as ImageIcon } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { StorageService } from '@/utils/storage';
import { AudioService } from '@/utils/audio';

export default function SettingsScreen() {
  const [customSound, setCustomSound] = useState<string | null>(null);
  const [customSoundName, setCustomSoundName] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [sound, image] = await Promise.all([
        StorageService.getCustomSound(),
        StorageService.getBackgroundImage(),
      ]);
      
      setCustomSound(sound);
      setBackgroundImage(image);
      
      if (sound) {
        // Extract filename from URI
        const filename = sound.split('/').pop() || 'Custom Sound';
        setCustomSoundName(filename);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const pickSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await StorageService.saveCustomSound(asset.uri);
        setCustomSound(asset.uri);
        setCustomSoundName(asset.name);
        
        if (Platform.OS === 'web') {
          alert('Success!\n\nCustom sound uploaded successfully!');
        } else {
          Alert.alert('Success', 'Custom sound uploaded successfully!');
        }
      }
    } catch (error) {
      console.error('Error picking sound:', error);
      if (Platform.OS === 'web') {
        alert('Error\n\nFailed to upload sound file. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to upload sound file. Please try again.');
      }
    }
  };

  const removeSound = async () => {
    const confirmRemove = async () => {
      await StorageService.removeCustomSound();
      setCustomSound(null);
      setCustomSoundName(null);
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to remove your custom sound?')) {
        confirmRemove();
      }
    } else {
      Alert.alert(
        'Remove Custom Sound',
        'Are you sure you want to remove your custom sound?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: confirmRemove,
          },
        ]
      );
    }
  };

  const testSound = async () => {
    try {
      await AudioService.testSound(customSound || undefined);
    } catch (error) {
      console.error('Error testing sound:', error);
      if (Platform.OS === 'web') {
        alert('Error\n\nFailed to play sound. Please check your audio file.');
      } else {
        Alert.alert('Error', 'Failed to play sound. Please check your audio file.');
      }
    }
  };

  const pickBackgroundImage = async () => {
    try {
      // Request permission for mobile
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
          Alert.alert('Permission Required', 'Permission to access camera roll is required!');
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
          alert('Success!\n\nBackground image updated successfully!');
        } else {
          Alert.alert('Success', 'Background image updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS === 'web') {
        alert('Error\n\nFailed to upload image. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
    }
  };

  const removeBackgroundImage = async () => {
    const confirmRemove = async () => {
      await StorageService.removeBackgroundImage();
      setBackgroundImage(null);
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to remove your custom background?')) {
        confirmRemove();
      }
    } else {
      Alert.alert(
        'Remove Background Image',
        'Are you sure you want to remove your custom background?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: confirmRemove,
          },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      {/* Timer Sound Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timer Sound</Text>
        <Text style={styles.sectionDescription}>
          Choose your focus timer sound
        </Text>

        <View style={styles.soundOptions}>
          <View style={styles.soundOption}>
            <Text style={styles.soundOptionLabel}>Default Bell</Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => AudioService.testSound()}>
              <Volume2 size={20} color="#7C3AED" />
              <Text style={styles.testButtonText}>Test</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.customSoundSection}>
          <Text style={styles.customSoundTitle}>Custom Sound</Text>
          <Text style={styles.customSoundDescription}>
            Upload your own audio file
          </Text>

          <View style={styles.customSoundControls}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickSound}>
              <Upload size={20} color="#7C3AED" />
              <Text style={styles.uploadButtonText}>Upload Sound</Text>
            </TouchableOpacity>

            {customSound && (
              <TouchableOpacity style={styles.removeButton} onPress={removeSound}>
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {customSoundName && (
            <View style={styles.currentSound}>
              <Text style={styles.currentSoundText} numberOfLines={1}>
                {customSoundName}
              </Text>
              <TouchableOpacity
                style={styles.testButton}
                onPress={testSound}>
                <Volume2 size={20} color="#7C3AED" />
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Background Image Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Image</Text>
        <Text style={styles.sectionDescription}>
          Choose a custom background for your home screen
        </Text>

        {backgroundImage && (
          <View style={styles.currentBackground}>
            <Image source={{ uri: backgroundImage }} style={styles.backgroundPreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={removeBackgroundImage}>
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.backgroundButton} onPress={pickBackgroundImage}>
          <ImageIcon size={20} color="#7C3AED" />
          <Text style={styles.backgroundButtonText}>Choose Background</Text>
        </TouchableOpacity>
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
  soundOptions: {
    marginBottom: 20,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  soundOptionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  testButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#7C3AED',
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
  customSoundControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
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
  removeButton: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentSound: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  currentSoundText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#166534',
    flex: 1,
    marginRight: 12,
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
});