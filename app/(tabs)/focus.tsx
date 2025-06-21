import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Platform,
  Alert,
  Dimensions,
  AppState,
} from 'react-native';
import { Play, Pause, RefreshCw } from 'lucide-react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import TimerDisplay from '@/components/TimerDisplay';
import DurationSelector from '@/components/DurationSelector';
import BreakModal from '@/components/BreakModal';
import { StorageService, Activity } from '@/utils/storage';
import { AudioService, SoundOption, DEFAULT_SOUNDS } from '@/utils/audio';

const { width } = Dimensions.get('window');

// Background task for timer
const BACKGROUND_TIMER_TASK = 'background-timer-task';

TaskManager.defineTask(BACKGROUND_TIMER_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background timer task error:', error);
    return;
  }

  try {
    // This task will keep the timer running in background
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background timer task execution error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default function FocusScreen() {
  const [task, setTask] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [selectedSound, setSelectedSound] = useState<SoundOption | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  const backgroundStartTime = useRef<number | null>(null);
  
  const durations = [
    { label: '30s', value: 0.5 },
    { label: '1m', value: 1 },
    { label: '5m', value: 5 },
    { label: '10m', value: 10 },
    { label: '15m', value: 15 },
    { label: '25m', value: 25 },
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '60m', value: 60 },
  ];

  useEffect(() => {
    loadData();
    
    // Register background task
    if (Platform.OS !== 'web') {
      BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
        minimumInterval: 1000, // 1 second
        stopOnTerminate: false,
        startOnBoot: true,
      }).catch(console.error);
    }

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (Platform.OS !== 'web') {
        deactivateKeepAwake();
      }
      subscription?.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: string) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      if (isRunning && backgroundStartTime.current) {
        const timeInBackground = Math.floor((Date.now() - backgroundStartTime.current) / 1000);
        setTimeLeft(prevTime => {
          const newTime = Math.max(0, prevTime - timeInBackground);
          if (newTime <= 0) {
            handleTimerComplete();
          }
          return newTime;
        });
      }
      backgroundStartTime.current = null;
    } else if (nextAppState.match(/inactive|background/) && isRunning) {
      // App is going to background
      backgroundStartTime.current = Date.now();
    }
    
    appState.current = nextAppState;
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      if (Platform.OS !== 'web') {
        activateKeepAwakeAsync();
      }
      
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            handleTimerComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (Platform.OS !== 'web') {
        deactivateKeepAwake();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const loadData = async () => {
    try {
      console.log('🔄 Loading focus screen data...');
      
      const [loadedActivities, loadedBackground, loadedSound, customSounds] = await Promise.all([
        StorageService.getActivities(),
        StorageService.getBackgroundImage(),
        StorageService.getSelectedSound(),
        StorageService.getCustomSounds(),
      ]);
      
      setActivities(loadedActivities);
      setBackgroundImage(loadedBackground);
      
      console.log('🔊 Loaded sound from storage:', loadedSound);
      console.log('🎵 Available custom sounds:', customSounds);
      
      // Handle sound selection - prioritize new system, fallback to legacy
      if (loadedSound) {
        console.log('✅ Using selected sound:', loadedSound);
        setSelectedSound(loadedSound);
      } else {
        // Check for legacy custom sound
        const legacySound = await StorageService.getCustomSound();
        console.log('🔍 Checking for legacy sound:', legacySound);
        
        if (legacySound) {
          // Convert legacy sound to new format
          const legacySoundOption: SoundOption = {
            id: 'legacy_custom',
            name: 'Custom Sound (Legacy)',
            uri: legacySound,
            isDefault: false,
          };
          console.log('🔄 Converting legacy sound:', legacySoundOption);
          setSelectedSound(legacySoundOption);
          // Save in new format
          await StorageService.saveSelectedSound(legacySoundOption);
        } else {
          // Use default sound
          console.log('🔔 Using default sound');
          setSelectedSound(DEFAULT_SOUNDS[0]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading focus data:', error);
    }
  };

  const handleTimerComplete = async () => {
    console.log('⏰ Timer completed!');
    setIsRunning(false);
    backgroundStartTime.current = null;
    
    if (Platform.OS !== 'web') {
      deactivateKeepAwake();
    }
    
    console.log('🔊 About to play completion sound:', selectedSound);
    
    // Play completion sound with enhanced error handling
    try {
      const soundToPlay = selectedSound || DEFAULT_SOUNDS[0];
      console.log('🎵 Playing sound:', soundToPlay);
      
      await AudioService.playSound(soundToPlay);
      console.log('✅ Sound played successfully');
    } catch (error) {
      console.error('❌ Error playing completion sound:', error);
      // Try fallback sound
      try {
        console.log('🔄 Trying fallback sound...');
        await AudioService.playSound(DEFAULT_SOUNDS[0]);
        console.log('✅ Fallback sound played');
      } catch (fallbackError) {
        console.error('❌ Error playing fallback sound:', fallbackError);
        // Last resort - system notification
        AudioService.playSystemNotification();
      }
    }
    
    // Show break activity if available
    if (activities.length > 0) {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      setCurrentActivity(randomActivity);
      setShowBreakModal(true);
    } else {
      if (Platform.OS === 'web') {
        alert('Focus Session Complete!\n\nGreat job! Add some reward activities in the Activities tab for your next break.');
      } else {
        Alert.alert(
          'Focus Session Complete!',
          'Great job! Add some reward activities in the Activities tab for your next break.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const toggleTimer = () => {
    if (!task.trim()) {
      if (Platform.OS === 'web') {
        alert('Task Required\n\nPlease enter what you want to focus on.');
      } else {
        Alert.alert('Task Required', 'Please enter what you want to focus on.');
      }
      return;
    }
    
    if (!isRunning) {
      backgroundStartTime.current = null;
    }
    
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
    backgroundStartTime.current = null;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleDurationSelect = (duration: number) => {
    if (!isRunning) {
      setSelectedDuration(duration);
      setTimeLeft(duration * 60);
    }
  };

  const getNewActivity = () => {
    if (activities.length > 1) {
      let newActivity;
      do {
        newActivity = activities[Math.floor(Math.random() * activities.length)];
      } while (newActivity.id === currentActivity?.id && activities.length > 1);
      setCurrentActivity(newActivity);
    }
  };

  const defaultBackground = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <ImageBackground
      source={{ uri: backgroundImage || defaultBackground }}
      style={styles.backgroundImage}
      blurRadius={2}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Focus Timer</Text>
            <Text style={styles.subtitle}>Stay focused, be productive</Text>
          </View>

          <View style={styles.taskSection}>
            <Text style={styles.taskLabel}>What would you like to focus on?</Text>
            <TextInput
              style={styles.taskInput}
              value={task}
              onChangeText={setTask}
              placeholder="Enter your task..."
              placeholderTextColor="#9CA3AF"
              maxLength={100}
              multiline={false}
            />
          </View>

          <View style={styles.durationSection}>
            <Text style={styles.durationLabel}>Duration</Text>
            <DurationSelector
              durations={durations}
              selectedDuration={selectedDuration}
              onSelect={handleDurationSelect}
              disabled={isRunning}
            />
          </View>

          <TimerDisplay timeLeft={timeLeft} isRunning={isRunning} />

          <View style={styles.controls}>
            <TouchableOpacity 
              style={[styles.controlButton, isRunning && styles.controlButtonDisabled]} 
              onPress={resetTimer}
              disabled={isRunning}>
              <RefreshCw size={24} color={isRunning ? "#9CA3AF" : "#4B5563"} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.startButton, !task.trim() && styles.startButtonDisabled]}
              onPress={toggleTimer}
              disabled={!task.trim()}>
              {isRunning ? (
                <Pause size={28} color="#FFFFFF" />
              ) : (
                <Play size={28} color="#FFFFFF" />
              )}
              <Text style={styles.startButtonText}>
                {isRunning ? 'Pause' : 'Start Focusing'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Debug info - remove in production */}
          {__DEV__ && selectedSound && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Selected Sound: {selectedSound.name}
              </Text>
              <Text style={styles.debugText}>
                Is Custom: {!selectedSound.isDefault ? 'Yes' : 'No'}
              </Text>
              {selectedSound.uri && (
                <Text style={styles.debugText} numberOfLines={1}>
                  URI: {selectedSound.uri}
                </Text>
              )}
            </View>
          )}
        </View>

        <BreakModal
          visible={showBreakModal}
          activity={currentActivity}
          onClose={() => setShowBreakModal(false)}
          onNewActivity={getNewActivity}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#7C3AED',
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
  },
  taskSection: {
    marginBottom: 32,
  },
  taskLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 12,
  },
  taskInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 56,
  },
  durationSection: {
    marginBottom: 40,
  },
  durationLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: Platform.OS === 'web' ? 40 : 60,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: width * 0.6,
    justifyContent: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  startButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  debugInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
});