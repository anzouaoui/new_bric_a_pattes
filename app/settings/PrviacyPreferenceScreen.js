import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrivacyRow from '../../components/PrivacyRow';
import { auth, db } from '../../firebaseConfig';

export default function PrivacyPreferences() {
  const router = useRouter();
  const { currentUser } = auth;
  
  // State for preferences
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [receiveNewsletter, setReceiveNewsletter] = useState(false);
  const [receiveOffers, setReceiveOffers] = useState(false);
  const [shareData, setShareData] = useState(false);
  const [allowAds, setAllowAds] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser) return;
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          const prefs = docSnap.data().preferences || {};
          
          // Set all preference states with fallback to default values
          setIsProfilePublic(prefs.isProfilePublic ?? true);
          setShowLocation(prefs.showLocation ?? true);
          setReceiveNewsletter(prefs.receiveNewsletter ?? false);
          setReceiveOffers(prefs.receiveOffers ?? false);
          setShareData(prefs.shareData ?? false);
          setAllowAds(prefs.allowAds ?? false);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser]);

  // Handle preference changes
  const handlePreferenceChange = async (key, value) => {
    if (!currentUser) return;
    
    // Update local state
    switch (key) {
      case 'isProfilePublic':
        setIsProfilePublic(value);
        break;
      case 'showLocation':
        setShowLocation(value);
        break;
      case 'receiveNewsletter':
        setReceiveNewsletter(value);
        break;
      case 'receiveOffers':
        setReceiveOffers(value);
        break;
      case 'shareData':
        setShareData(value);
        break;
      case 'allowAds':
        setAllowAds(value);
        break;
      default:
        return;
    }
    
    // Update Firestore
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { 
        [`preferences.${key}`]: value 
      });
    } catch (error) {
      console.error("Error saving preference:", error);
      // Revert local state on error
      // (In a production app, you might want to show an error message to the user)
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#95ba72" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Préférences de Confidentialité</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Visibility Section */}
        <Text style={styles.sectionTitle}>VISIBILITÉ DU PROFIL</Text>
        <View style={styles.card}>
          <PrivacyRow
            icon="people-outline"
            label="Rendre mon profil public"
            description="Votre profil sera visible par tous les utilisateurs de l'application."
            showSwitch
            switchValue={isProfilePublic}
            onSwitchValueChange={(value) => handlePreferenceChange('isProfilePublic', value)}
          />
          <View style={styles.divider} />
          <PrivacyRow
            icon="location-outline"
            label="Afficher ma localisation"
            description="Partagez votre ville ou votre région avec les autres utilisateurs."
            showSwitch
            switchValue={showLocation}
            onSwitchValueChange={(value) => handlePreferenceChange('showLocation', value)}
          />
        </View>

        {/* Communications Section */}
        <Text style={styles.sectionTitle}>COMMUNICATIONS</Text>
        <View style={styles.card}>
          <PrivacyRow
            icon="mail-outline"
            label="Recevoir la newsletter"
            description="Recevez des mises à jour et des actualités par e-mail."
            showSwitch
            switchValue={receiveNewsletter}
            onSwitchValueChange={(value) => handlePreferenceChange('receiveNewsletter', value)}
          />
          <View style={styles.divider} />
          <PrivacyRow
            icon="gift-outline"
            label="Recevoir des offres personnalisées"
            description="Recevez des offres spéciales basées sur vos intérêts."
            showSwitch
            switchValue={receiveOffers}
            onSwitchValueChange={(value) => handlePreferenceChange('receiveOffers', value)}
          />
        </View>

        {/* Data Sharing Section */}
        <Text style={styles.sectionTitle}>PARTAGE DES DONNÉES</Text>
        <View style={styles.card}>
          <PrivacyRow
            icon="share-social-outline"
            label="Partager des données avec des partenaires"
            description="Autorisez le partage de données anonymisées avec nos partenaires de confiance."
            showSwitch
            switchValue={shareData}
            onSwitchValueChange={(value) => handlePreferenceChange('shareData', value)}
          />
          <View style={styles.divider} />
          <PrivacyRow
            icon="megaphone-outline"
            label="Personnaliser les publicités"
            description="Affichez des publicités personnalisées en fonction de vos centres d'intérêt."
            showSwitch
            switchValue={allowAds}
            onSwitchValueChange={(value) => handlePreferenceChange('allowAds', value)}
          />
        </View>

        {/* Legal Information Section */}
        <Text style={styles.sectionTitle}>INFORMATIONS LÉGALES</Text>
        <View style={styles.card}>
          <PrivacyRow
            icon="document-text-outline"
            label="Politique de confidentialité"
            showChevron
            onPress={() => router.push('/legal/privacy-policy')}
          />
          <View style={styles.divider} />
          <PrivacyRow
            icon="shield-checkmark-outline"
            label="Gérer mes données"
            showChevron
            onPress={() => router.push('/legal/manage-data')}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
  },
  sectionTitle: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 60,
    marginRight: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
