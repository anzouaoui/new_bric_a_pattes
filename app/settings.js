import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SettingsRow } from '../components/SettingsRow';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <Text style={styles.sectionTitle}>COMPTE</Text>
        <View style={styles.card}>
          <SettingsRow 
            icon="key-outline"
            label="Changer le mot de passe"
            onPress={() => router.push('/settings/change-password')}
          />
          <SettingsRow 
            icon="lock-closed-outline"
            label="Préférences de confidentialité"
            onPress={() => console.log("Privacy preferences")}
          />
        </View>

        {/* Application Section */}
        <Text style={styles.sectionTitle}>APPLICATION</Text>
        <View style={styles.card}>
          <SettingsRow 
            icon="notifications-outline"
            label="Gérer les notifications"
            showSwitch={true}
            switchValue={notificationsEnabled}
            onSwitchValueChange={setNotificationsEnabled}
          />
          <SettingsRow 
            icon="notifications-outline"
            label="Voir toutes les notifications"
            onPress={() => router.push('/notifications')}
          />
          <SettingsRow 
            icon="language-outline"
            label="Langue"
            rightComponent={
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{color: '#6B7280', marginRight: 4}}>Français</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
              </View>
            }
          />
        </View>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.card}>
          <SettingsRow 
            icon="help-circle-outline"
            label="Aide & FAQ"
            onPress={() => console.log("Help & FAQ")}
          />
          <SettingsRow 
            icon="mail-outline"
            label="Nous contacter"
            onPress={() => console.log("Contact us")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#111827',
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
});
