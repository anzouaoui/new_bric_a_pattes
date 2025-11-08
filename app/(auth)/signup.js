import { AntDesign, Feather, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    postalCode: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      setError("Erreur lors de la sélection de l'image");
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Étape 1 : Création du compte utilisateur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Étape 2 : Création du document utilisateur dans Firestore
      const userDocRef = doc(db, "users", user.uid);

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: email.split('@')[0], // Pseudo par défaut basé sur l'email
        avatarUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y', // Avatar par défaut
        createdAt: serverTimestamp(),
        favorites: [],
        listings: [],
        phoneNumber: phoneNumber,
        address: {
          street: address.street,
          city: address.city,
          postalCode: address.postalCode,
          country: 'France'
        }
      };

      await setDoc(userDocRef, userData);
      
      console.log('Utilisateur créé avec succès:', user.uid);
      
      // Redirection vers l'écran d'accueil après inscription réussie
      router.replace('/(tabs)');
    } catch (error) {
      console.error("Erreur lors de l'inscription: ", error);
      
      // Gestion des erreurs spécifiques
      let errorMessage = "Une erreur est survenue lors de l'inscription";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Cet email est déjà utilisé par un autre compte";
          break;
        case 'auth/invalid-email':
          errorMessage = "L'adresse email n'est pas valide";
          break;
        case 'auth/weak-password':
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      {/* Titre de la page */}
      <Text style={styles.title}>Créez votre compte</Text>
      <Text style={styles.subtitle}>Rejoignez la communauté des amoureux des animaux</Text>

      {/* Affichage des erreurs */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Formulaire */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Adresse e-mail</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="entrez votre email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Feather name="mail" size={20} color="grey" />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="entrez votre mot de passe"
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Feather name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color="grey" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="confirmez votre mot de passe"
            secureTextEntry={!isConfirmPasswordVisible}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
            <Feather name={isConfirmPasswordVisible ? 'eye-off' : 'eye'} size={20} color="grey" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Champ Téléphone */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Entrez votre numéro de téléphone"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <Feather name="phone" size={20} color="grey" />
        </View>
      </View>

      {/* Champ Adresse */}
      <Text style={[styles.label, {marginTop: 8}]}>Adresse</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.subLabel}>Rue</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="N° et nom de la rue"
            value={address.street}
            onChangeText={(text) => setAddress({...address, street: text})}
          />
          <Feather name="map-pin" size={18} color="grey" />
        </View>
      </View>

      <View style={styles.addressRow}>
        <View style={[styles.formGroup, {flex: 2, marginRight: 10}]}>
          <Text style={styles.subLabel}>Code postal</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Code postal"
              keyboardType="number-pad"
              value={address.postalCode}
              onChangeText={(text) => setAddress({...address, postalCode: text})}
              maxLength={5}
            />
          </View>
        </View>
        <View style={[styles.formGroup, {flex: 3}]}>
          <Text style={styles.subLabel}>Ville</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ville"
              value={address.city}
              onChangeText={(text) => setAddress({...address, city: text})}
            />
          </View>
        </View>
      </View>

      {/* Photo de profil */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Photo de profil (optionnel)</Text>
        <TouchableOpacity 
          style={styles.photoPicker}
          onPress={handlePickImage}
          disabled={isUploading}
        >
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profileImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Feather name="camera" size={28} color="#9CA3AF" />
              <Text style={styles.photoText}>Ajouter une photo</Text>
            </View>
          )}
          {isUploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Texte légal */}
      <Text style={styles.legalText}>
        En vous inscrivant, vous acceptez nos{' '}
        <Text style={styles.legalLink}>Conditions d'utilisation</Text> et notre{' '}
        <Text style={styles.legalLink}>Politique de confidentialité</Text>.
      </Text>

      {/* Bouton d'inscription */}
      <View style={{marginTop: 20, marginBottom: 30}}>
        <TouchableOpacity 
          style={[
            styles.signUpButton, 
            (isLoading || !email || !password || !confirmPassword) && styles.disabledButton
          ]}
          onPress={handleSignUp}
          disabled={isLoading || !email || !password || !confirmPassword}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signUpButtonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Séparateur */}
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>Ou continuer avec</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Boutons sociaux */}
      <View style={styles.socialButtons}>
        <TouchableOpacity style={styles.socialButton}>
          <AntDesign name="google" size={28} color="#DB4437" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <FontAwesome name="facebook-f" size={28} color="#3b5998" />
        </TouchableOpacity>
      </View>

      {/* Lien de connexion */}
      <Pressable 
        style={styles.loginLink}
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={styles.loginText}>
          <Text style={{color: 'grey'}}>Déjà membre ? </Text>
          <Text style={{color: '#c59f77', fontWeight: 'bold'}}>Connectez-vous</Text>
        </Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: 'grey',
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    height: 50,
    paddingRight: 10,
  },
  subLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoPicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
    marginVertical: 10,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalText: {
    fontSize: 13,
    color: 'grey',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 20,
  },
  legalLink: {
    color: '#c59f77',
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#95ba72',
    paddingVertical: 18,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  loginLink: {
    marginTop: 30,
    alignSelf: 'center',
  },
  loginText: {
    fontSize: 15,
  },
});

export default SignUpScreen;
