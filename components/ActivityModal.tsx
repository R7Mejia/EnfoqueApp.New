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
import { Activity, ActivityCategories } from '@/utils/storage';

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (activity: Activity) => void;
}

export default function ActivityModal({ visible, onClose, onAdd }: ActivityModalProps) {
  const [activityName, setActivityName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('recreation');

  const handleAdd = () => {
    if (activityName.trim()) {
      const newActivity: Activity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: activityName.trim(),
        category: selectedCategory,
        emoji: ActivityCategories[selectedCategory as keyof typeof ActivityCategories].emoji,
        createdAt: Date.now(),
      };
      
      onAdd(newActivity);
      setActivityName('');
      setSelectedCategory('recreation');
      onClose();
    } else {
      if (Platform.OS === 'web') {
        alert('Error\n\nPlease enter an activity name');
      } else {
        Alert.alert('Error', 'Please enter an activity name');
      }
    }
  };

  const handleClose = () => {
    setActivityName('');
    setSelectedCategory('recreation');
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
          <Text style={styles.title}>Add Activity</Text>
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <Plus size={24} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Activity Name</Text>
            <TextInput
              style={styles.input}
              value={activityName}
              onChangeText={setActivityName}
              placeholder="Enter a motivational activity..."
              placeholderTextColor="#9CA3AF"
              maxLength={50}
              autoFocus
              multiline={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.categoryHint}>
              Choose a category that best describes your activity
            </Text>
            
            <View style={styles.categoriesGrid}>
              {Object.entries(ActivityCategories).map(([key, category]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryOption,
                    selectedCategory === key && styles.selectedCategory,
                  ]}
                  onPress={() => setSelectedCategory(key)}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === key && styles.selectedCategoryText,
                    ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.hint}>
              Add activities that motivate you or bring you joy during breaks. 
              These will be randomly suggested when your focus sessions end.
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
  categoryHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: '45%',
    gap: 8,
  },
  selectedCategory: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3F4F6',
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  selectedCategoryText: {
    color: '#7C3AED',
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