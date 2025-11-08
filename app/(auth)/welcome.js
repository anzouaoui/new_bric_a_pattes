import { Link } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WelcomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header avec logo */}
        <View style={styles.header}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        </View>

        {/* Image principale */}
        <Image 
          source={require('../../assets/images/beagle.png')} 
          style={styles.mainImage}
          resizeMode="cover"
        />

        {/* Titre */}
        <Text style={styles.title}>
          Donnez une seconde vie aux accessoires de vos animaux
        </Text>

        {/* Boutons d'action */}
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>S'inscrire</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </Link>

        {/* Texte légal */}
        <View style={styles.legalTextContainer}>
          <Text style={styles.legalText}>
            En continuant, vous acceptez nos{' '}
            <Text style={styles.legalLink}>Conditions d'utilisation</Text>{' '}
            et notre{' '}
            <Text style={styles.legalLink}>Politique de confidentialité</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logo: {
    width: 200,
    height: 200,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mainImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#1F2937',
  },
  primaryButton: {
    backgroundColor: '#95ba72',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#E0F2F1',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    marginHorizontal: 10,
    color: 'grey',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legalTextContainer: {
    marginTop: 20,
    marginBottom: 60,
  },
  legalText: {
    fontSize: 12,
    color: 'grey',
    textAlign: 'center',
  },
  legalLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
