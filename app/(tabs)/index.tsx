import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Platform,
  Dimensions,
} from 'react-native';
import { Clock, ListTodo, Settings, Play, Zap, Target, Brain } from 'lucide-react-native';
import { router } from 'expo-router';
import { StorageService } from '@/utils/storage';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    loadBackgroundImage();
  }, []);

  const loadBackgroundImage = async () => {
    try {
      const image = await StorageService.getBackgroundImage();
      setBackgroundImage(image);
    } catch (error) {
      console.error('Error loading background image:', error);
    }
  };

  const defaultBackground = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200';

  const features = [
    {
      icon: Clock,
      title: 'Focus Timer',
      description: 'Start focused work sessions with customizable durations',
      color: '#7C3AED',
      route: '/focus',
    },
    {
      icon: ListTodo,
      title: 'Reward Activities',
      description: 'Manage your motivational break activities',
      color: '#059669',
      route: '/activities',
    },
    {
      icon: Settings,
      title: 'Customize',
      description: 'Personalize sounds, backgrounds, and preferences',
      color: '#DC2626',
      route: '/settings',
    },
  ];

  const adhdTips = [
    {
      icon: Brain,
      title: 'Break Tasks Down',
      description: 'Divide large tasks into smaller, manageable chunks',
    },
    {
      icon: Target,
      title: 'Set Clear Goals',
      description: 'Define specific, achievable objectives for each session',
    },
    {
      icon: Zap,
      title: 'Use Rewards',
      description: 'Celebrate completions with enjoyable activities',
    },
  ];

  return (
    <ImageBackground
      source={{ uri: backgroundImage || defaultBackground }}
      style={styles.backgroundImage}
      blurRadius={2}>
      <View style={styles.overlay}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>¡Enfoque!</Text>
            <Text style={styles.subtitle}>Your ADHD-Friendly Focus Companion</Text>
            <Text style={styles.description}>
              Designed to help you stay focused, productive, and motivated with 
              customizable timers and rewarding break activities.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.quickStartButton}
            onPress={() => router.push('/focus')}>
            <Play size={24} color="#FFFFFF" />
            <Text style={styles.quickStartText}>Quick Start Focus Session</Text>
          </TouchableOpacity>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Features</Text>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={() => router.push(feature.route)}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                  <feature.icon size={28} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>ADHD Focus Tips</Text>
            {adhdTips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <View style={styles.tipIcon}>
                  <tip.icon size={20} color="#7C3AED" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDescription}>{tip.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.instructionsSection}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Set your task and choose a focus duration (30 seconds to 1 hour)
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Start your timer and focus on your task without distractions
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Enjoy a rewarding break activity when your session completes
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>4</Text>
                </View>
                <Text style={styles.instructionText}>
                  Customize sounds, backgrounds, and activities to your preferences
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 36,
    color: '#7C3AED',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  quickStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
    marginBottom: 32,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  quickStartText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  tipsSection: {
    marginBottom: 32,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  tipDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  instructionsSection: {
    marginBottom: 40,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    paddingTop: 4,
  },
});