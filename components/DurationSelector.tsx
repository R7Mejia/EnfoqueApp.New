import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DurationSelectorProps {
  durations: number[];
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
    <View style={styles.container}>
      {durations.map((duration) => (
        <TouchableOpacity
          key={duration}
          style={[
            styles.durationButton,
            selectedDuration === duration && styles.selectedDuration,
            disabled && styles.disabledButton,
          ]}
          onPress={() => !disabled && onSelect(duration)}
          disabled={disabled}>
          <Text
            style={[
              styles.durationText,
              selectedDuration === duration && styles.selectedDurationText,
              disabled && styles.disabledText,
            ]}>
            {duration}m
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  durationButton: {
    paddingHorizontal: 24,
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
    fontSize: 16,
    color: '#4B5563',
  },
  selectedDurationText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
});