import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const SettingsRow = ({
  icon,
  label,
  showChevron = true,
  showSwitch = false,
  switchValue,
  onSwitchValueChange,
  onPress,
  rightComponent,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
      }}
      disabled={!onPress && !showSwitch}
    >
      {icon && (
        <View style={{ marginRight: 12 }}>
          <Ionicons name={icon} size={20} color="#4B5563" />
        </View>
      )}
      <Text style={{ flex: 1, fontSize: 16, color: '#111827' }}>{label}</Text>
      
      {rightComponent}
      
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchValueChange}
          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
          thumbColor="white"
        />
      )}
      
      {showChevron && !showSwitch && !rightComponent && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
};
