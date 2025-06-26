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
import { Plus, X, Trash2, Settings } from 'lucide-react-native';
import ActivityModal from '@/components/ActivityModal';
import CategoryModal from '@/components/CategoryModal';
import { StorageService, Activity, CustomCategory } from '@/utils/storage';

function ActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedActivities, loadedCategories] = await Promise.all([
        StorageService.getActivities(),
        StorageService.getAllCategories(),
      ]);
      setActivities(loadedActivities);
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addActivity = async (activity: Activity) => {
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

  const addCategory = async (category: CustomCategory) => {
    await StorageService.addCustomCategory(category);
    const updatedCategories = await StorageService.getAllCategories();
    setCategories(updatedCategories);
  };

  const removeActivity = async (id: string) => {
    const confirmRemove = () => {
      const newActivities = activities.filter((activity) => activity.id !== id);
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

  const removeCategory = async (categoryId: string) => {
    // Check if category is being used by any activities
    const isUsed = activities.some(
      (activity) => activity.category === categoryId
    );

    if (isUsed) {
      if (Platform.OS === 'web') {
        alert(
          'Cannot Remove Category\n\nThis category is being used by one or more activities. Please remove or reassign those activities first.'
        );
      } else {
        Alert.alert(
          'Cannot Remove Category',
          'This category is being used by one or more activities. Please remove or reassign those activities first.'
        );
      }
      return;
    }

    const confirmRemove = async () => {
      await StorageService.removeCustomCategory(categoryId);
      const updatedCategories = await StorageService.getAllCategories();
      setCategories(updatedCategories);
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to remove this category?')) {
        confirmRemove();
      }
    } else {
      Alert.alert(
        'Remove Category',
        'Are you sure you want to remove this category?',
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
      if (
        confirm(
          'Are you sure you want to remove all activities? This cannot be undone.'
        )
      ) {
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

  const groupedActivities = activities.reduce((groups, activity) => {
    const category = activity.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  const getCategoryInfo = (categoryId: string) => {
    return (
      categories.find((cat) => cat.id === categoryId) || {
        id: categoryId,
        name: 'Unknown',
        emoji: '❓',
        isDefault: true,
        createdAt: 0,
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reward Activities</Text>
        <Text style={styles.subtitle}>
          Manage your reward activities and categories
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.addButton,
            activities.length >= 20 && styles.addButtonDisabled,
          ]}
          onPress={() => setShowActivityModal(true)}
          disabled={activities.length >= 20}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Activity</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <Settings size={20} color="#7C3AED" />
          <Text style={styles.categoryButtonText}>Categories</Text>
        </TouchableOpacity>
      </View>

      {activities.length > 0 && (
        <View style={styles.headerActions}>
          <Text style={styles.counter}>{activities.length}/20 activities</Text>
          <TouchableOpacity
            onPress={clearAllActivities}
            style={styles.clearButton}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.activitiesList}
        showsVerticalScrollIndicator={false}
      >
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptyDescription}>
              Add some motivational activities that you enjoy doing during
              breaks. These will be randomly suggested when your focus sessions
              end.
            </Text>
          </View>
        ) : (
          Object.entries(groupedActivities).map(
            ([categoryKey, categoryActivities]) => {
              const categoryInfo = getCategoryInfo(categoryKey);

              return (
                <View key={categoryKey} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryEmoji}>
                      {categoryInfo.emoji}
                    </Text>
                    <Text style={styles.categoryTitle}>
                      {categoryInfo.name}
                    </Text>
                    <Text style={styles.categoryCount}>
                      ({categoryActivities.length})
                    </Text>
                    {!categoryInfo.isDefault && (
                      <TouchableOpacity
                        style={styles.removeCategoryButton}
                        onPress={() => removeCategory(categoryInfo.id)}
                      >
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {categoryActivities.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityEmoji}>
                          {activity.emoji}
                        </Text>
                        <Text style={styles.activityText}>{activity.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeActivity(activity.id)}
                      >
                        <X size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            }
          )
        )}

        {/* Custom Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesSectionTitle}>Your Categories</Text>
          <Text style={styles.categoriesSectionDesc}>
            Manage your custom categories. Default categories cannot be removed.
          </Text>

          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <Text style={styles.categoryCardEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryCardName}>{category.name}</Text>
                {!category.isDefault && (
                  <TouchableOpacity
                    style={styles.removeCategoryCardButton}
                    onPress={() => removeCategory(category.id)}
                  >
                    <X size={14} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <ActivityModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onAdd={addActivity}
      />

      <CategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onAdd={addCategory}
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
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
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  categoryButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#7C3AED',
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
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1F2937',
    flex: 1,
  },
  categoryCount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  removeCategoryButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
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
  activityEmoji: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
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
  categoriesSection: {
    marginTop: 32,
    marginBottom: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  categoriesSectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  categoriesSectionDesc: {
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
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: '45%',
    alignItems: 'center',
    position: 'relative',
  },
  categoryCardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryCardName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  removeCategoryCardButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
});

export default ActivitiesScreen;
