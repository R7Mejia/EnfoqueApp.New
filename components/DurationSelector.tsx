import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Duration {
  label: string;
  value: number;
}

interface DurationSelectorProps {
  durations: Duration[];
  selectedDuration: number;
  onSelect: (duration: number) => void;
  disabled?: boolean;
}

export default function DurationSelector({ 
  durations, 
  selectedDuration, 
  onSelect, 
  disabled = false 
}: DurationSelectorProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {durations.map((duration) => (
        <TouchableOpacity
          key={duration.value}
          style={[
            styles.durationButton,
            selectedDuration === duration.value && styles.selectedDuration,
            disabled && styles.disabledButton,
          ]}
          onPress={() => !disabled && onSelect(duration.value)}
          disabled={disabled}>
          <Text
            style={[
              styles.durationText,
              selectedDuration === duration.value && styles.selectedDurationText,
              disabled && styles.disabledText,
            ]}>
            {duration.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDuration: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  durationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#4B5563',
  },
  selectedDurationText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
});