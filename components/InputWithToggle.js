import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InputWithToggle = ({
  value,
  onChangeText,
  placeholder,
  isPassword = false,
  isVisible = true,
  onToggleVisibility,
  style,
  error = false,
  ...props
}) => {
  return (
    <View style={[styles.container, error && styles.errorBorder, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={isPassword && !isVisible}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {isPassword && (
        <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeIcon}>
          <Ionicons 
            name={isVisible ? 'eye-off-outline' : 'eye-outline'} 
            size={20} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  errorBorder: {
    borderColor: '#EF4444',
  },
});

export default InputWithToggle;
