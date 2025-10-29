import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsRow } from '../components/SettingsRow';
import { auth } from '../firebaseConfig';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Redirection is handled by the auth state listener in _layout.tsx
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la déconnexion.");
    }
  };

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
            onPress={() => router.push('settings/ChangePasswordScreen')}
          />
          <SettingsRow 
            icon="lock-closed-outline"
            label="Préférences de confidentialité"
            onPress={() => router.push('settings/PrviacyPreferenceScreen')}
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
            icon="language-outline"
            label="Langue"
            onPress={() => router.push('settings/LanguageScreen')}
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

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </View>
        </TouchableOpacity>
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
  logoutButton: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 32,
    marginBottom: 24,
  },
  logoutContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});
