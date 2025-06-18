import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerDisplayProps {
  timeLeft: number;
  isRunning: boolean;
}

export default function TimerDisplay({ timeLeft, isRunning }: TimerDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.timer, isRunning && styles.timerActive]}>
        {formatTime(timeLeft)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 20,
  },
  timer: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 72,
    color: '#1F2937',
    fontWeight: '700',
    textAlign: 'center',
  },
  timerActive: {
    color: '#7C3AED',
  },
});