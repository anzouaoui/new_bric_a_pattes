import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
];

export default function LanguageScreen() {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [selectedLanguage, setSelectedLanguage] = useState('fr');
  const router = useRouter();

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const lang = await AsyncStorage.getItem('user-language') || 'fr';
        setCurrentLanguage(lang);
        setSelectedLanguage(lang);
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    loadLanguage();
  }, []);

  const handleSave = async () => {
    if (selectedLanguage === currentLanguage) {
      router.back();
      return;
    }

    try {
      // Sauvegarder la préférence
      await AsyncStorage.setItem('user-language', selectedLanguage);
      
      // Ici, vous pouvez ajouter la logique pour changer la langue de l'application
      // Par exemple : i18n.locale = selectedLanguage;
      
      Alert.alert(
        "Langue mise à jour",
        "Les modifications seront appliquées au prochain redémarrage.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert("Erreur", "Impossible de sauvegarder la préférence de langue.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Langue</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Contenu */}
      <ScrollView style={styles.container}>
        <Text style={styles.description}>
          Sélectionnez votre langue préférée pour l'application.
        </Text>

        {LANGUAGES.map((item) => (
          <TouchableOpacity
            key={item.code}
            style={[
              styles.languageItem,
              selectedLanguage === item.code && styles.languageItemSelected
            ]}
            onPress={() => setSelectedLanguage(item.code)}
          >
            <Text style={styles.languageName}>{item.name}</Text>
            <View style={styles.radioOuter}>
              {selectedLanguage === item.code && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pied de page */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginTop: 24,
    marginBottom: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  languageItemSelected: {
    borderColor: '#95ba72',
    backgroundColor: '#F0FDF4',
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#95ba72',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#95ba72',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  saveButton: {
    backgroundColor: '#95ba72',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
};

// Ajoutez cette ligne pour activer le nom d'affichage dans React DevTools
LanguageScreen.displayName = 'LanguageScreen';
