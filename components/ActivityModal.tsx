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
} from 'react-native';
import { X, Plus } from 'lucide-react-native';

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (activity: string) => void;
}

export default function ActivityModal({ visible, onClose, onAdd }: ActivityModalProps) {
  const [activity, setActivity] = useState('');

  const handleAdd = () => {
    if (activity.trim()) {
      onAdd(activity.trim());
      setActivity('');
      onClose();
    } else {
      if (Platform.OS === 'web') {
        alert('Error\n\nPlease enter an activity');
      } else {
        Alert.alert('Error', 'Please enter an activity');
      }
    }
  };

  const handleClose = () => {
    setActivity('');
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

        <View style={styles.content}>
          <Text style={styles.label}>Activity Name</Text>
          <TextInput
            style={styles.input}
            value={activity}
            onChangeText={setActivity}
            placeholder="Enter a motivational activity..."
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            autoFocus
            multiline={false}
          />
          <Text style={styles.hint}>
            Add activities that motivate you or bring you joy during breaks
          </Text>
        </View>
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
    padding: 20,
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
    marginBottom: 12,
    minHeight: 48,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});