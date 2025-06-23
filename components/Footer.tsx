import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const appDescription =
    'Designed to help you stay focused, productive, and motivated with customizable timers and rewarding break activities.';
const copyright = `© ${new Date().getFullYear()} R_Mejia developer | All Rights Reserved`;

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.description}>{appDescription}</Text>
      <Text style={styles.copyright}>{copyright}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#1a237e', // Navy blue
    borderTopWidth: 0,
  },
  description: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  copyright: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
