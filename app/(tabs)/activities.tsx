import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Plus, X, Trash2 } from 'lucide-react-native';
import ActivityModal from '@/components/ActivityModal';
import { StorageService } from '@/utils/storage';

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const loadedActivities = await StorageService.getActivities();
    setActivities(loadedActivities);
  };

  const addActivity = async (activity: string) => {
    if (activities.length >= 20) {
      if (Platform.OS === 'web') {
        alert('Limit Reached\n\nYou can only have up to 20 activities.');
      } else {
        Alert.alert('Limit Reached', 'You can only have up to 20 activities.');
      }
      return;
    }

    const newActivities = [...activities, activity];
    setActivities(newActivities);
    await StorageService.saveActivities(newActivities);
  };

  const removeActivity = async (index: number) => {
    const confirmRemove = () => {
      const newActivities = activities.filter((_, i) => i !== index);
      setActivities(newActivities);
      StorageService.saveActivities(newActivities);
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to remove this activity?')) {
        confirmRemove();
      }
    } else {
      Alert.alert(
        'Remove Activity',
        'Are you sure you want to remove this activity?',
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

  const clearAllActivities = async () => {
    const confirmClear = () => {
      setActivities([]);
      StorageService.saveActivities([]);
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to remove all activities? This cannot be undone.')) {
        confirmClear();
      }
    } else {
      Alert.alert(
        'Clear All Activities',
        'Are you sure you want to remove all activities? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: confirmClear,
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reward Activities</Text>
        <Text style={styles.subtitle}>Manage your reward activities</Text>
      </View>

      <TouchableOpacity
        style={[styles.addButton, activities.length >= 20 && styles.addButtonDisabled]}
        onPress={() => setShowModal(true)}
        disabled={activities.length >= 20}>
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Activity</Text>
      </TouchableOpacity>

      {activities.length > 0 && (
        <View style={styles.headerActions}>
          <Text style={styles.counter}>
            {activities.length}/20 activities
          </Text>
          <TouchableOpacity onPress={clearAllActivities} style={styles.clearButton}>
            <Trash2 size={16} color="#EF4444" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.activitiesList} showsVerticalScrollIndicator={false}>
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptyDescription}>
              Add some motivational activities that you enjoy doing during breaks.
              These will be randomly suggested when your focus sessions end.
            </Text>
          </View>
        ) : (
          activities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityContent}>
                <Text style={styles.activityNumber}>{index + 1}</Text>
                <Text style={styles.activityText}>{activity}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeActivity(index)}>
                <X size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <ActivityModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addActivity}
      />
    </View>
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
    marginBottom: 24,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  addButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  counter: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6B7280',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  clearButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#EF4444',
  },
  activitiesList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#7C3AED',
    backgroundColor: '#F3F4F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  activityText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
});