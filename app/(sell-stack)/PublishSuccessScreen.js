import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PublishSuccessScreen() {
  const router = useRouter();
  const { newListingId } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Cercle vert avec icône de validation */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-done" size={48} color="#95ba72" />
        </View>

        {/* Titre */}
        <Text style={styles.title}>Annonce publiée avec succès !</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          Votre annonce est maintenant visible par les autres utilisateurs.
        </Text>

        {/* Bouton Booster mon annonce (Nouveau CTA Primaire) */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            router.push({
              pathname: '/(boost)/BoostOptionsScreen',
              params: { listingId: newListingId }
            });
          }}
        >
          <Text style={styles.primaryButtonText}>Booster mon annonce</Text>
        </TouchableOpacity>

        {/* Bouton Voir mon annonce (Nouveau CTA Secondaire) */}
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => {
            router.push({
              pathname: `/listing/${newListingId}`,
            });
          }}
        >
          <Text style={styles.secondaryButtonText}>Voir mon annonce</Text>
        </TouchableOpacity>

        {/* Bouton Retour à l'accueil (Tertiaire) */}
        <TouchableOpacity 
          style={styles.tertiaryButton}
          onPress={() => router.replace('/(tabs)/')}
        >
          <Text style={styles.tertiaryButtonText}>Retourner à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
    color: '#111827',
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#95ba72',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#c59f77',
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 16,
  },
  secondaryButtonText: {
    color: '#c59f77',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  tertiaryButton: {
    padding: 12,
    marginTop: 12,
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
});
