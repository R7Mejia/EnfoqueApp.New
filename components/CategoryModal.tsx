import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { CustomCategory } from '@/utils/storage';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (category: CustomCategory) => void;
}

const EMOJI_OPTIONS = [
  '🎯', '🚀', '💡', '⭐', '🔥', '💎', '🌟', '🎨', '🎭', '🎪',
  '🎸', '🎹', '🎤', '🎧', '📚', '✏️', '🖊️', '📝', '💻', '🖥️',
  '📱', '⌚', '🎮', '🕹️', '🎲', '🧩', '🎯', '🏆', '🥇', '🏅',
  '🎖️', '🏃', '🚴', '🏊', '🧘', '🤸', '🏋️', '⚽', '🏀', '🎾',
  '🏓', '🏸', '🥊', '🎿', '🏂', '🏄', '🚣', '🧗', '🤺', '🏇',
  '🍎', '🍕', '🍔', '🍟', '🌮', '🍜', '🍝', '🍲', '🥗', '🍰',
  '☕', '🍵', '🥤', '🍷', '🍺', '🥂', '🍾', '🎂', '🍭', '🍫',
  '🌸', '🌺', '🌻', '🌷', '🌹', '🌿', '🍀', '🌱', '🌳', '🌲',
  '🏔️', '🏖️', '🏝️', '🌊', '🌈', '⛅', '🌤️', '☀️', '🌙', '⭐',
];

export default function CategoryModal({ visible, onClose, onAdd }: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('✨');

  const handleAdd = () => {
    if (categoryName.trim()) {
      const newCategory: CustomCategory = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: categoryName.trim(),
        emoji: selectedEmoji,
        isDefault: false,
        createdAt: Date.now(),
      };
      
      onAdd(newCategory);
      setCategoryName('');
      setSelectedEmoji('✨');
      onClose();
    } else {
      if (Platform.OS === 'web') {
        alert('Error\n\nPlease enter a category name');
      } else {
        Alert.alert('Error', 'Please enter a category name');
      }
    }
  };

  const handleClose = () => {
    setCategoryName('');
    setSelectedEmoji('✨');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Category</Text>
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <Plus size={24} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Category Name</Text>
            <TextInput
              style={styles.input}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Enter category name..."
              placeholderTextColor="#9CA3AF"
              maxLength={30}
              autoFocus
              multiline={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Choose Emoji</Text>
            <Text style={styles.emojiHint}>
              Select an emoji to represent your category
            </Text>
            
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.selectedEmoji,
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
              <Text style={styles.previewText}>
                {categoryName.trim() || 'Category Name'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.hint}>
              Create custom categories to better organize your reward activities. 
              Your categories are private and unique to your device.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1F2937',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 48,
  },
  emojiHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedEmoji: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3F4F6',
  },
  emojiText: {
    fontSize: 24,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  previewEmoji: {
    fontSize: 24,
  },
  previewText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});