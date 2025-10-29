import { AntDesign, Feather, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../firebaseConfig';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // La navigation sera gérée automatiquement par le RootLayout
    } catch (error) {
      alert(error.message);
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

      {/* Texte légal */}
      <Text style={styles.legalText}>
        En vous inscrivant, vous acceptez nos{' '}
        <Text style={styles.legalLink}>Conditions d'utilisation</Text> et notre{' '}
        <Text style={styles.legalLink}>Politique de confidentialité</Text>.
      </Text>

      {/* Bouton d'inscription */}
      <TouchableOpacity 
        style={styles.signUpButton}
        onPress={handleSignUp}
      >
        <Text style={styles.signUpButtonText}>Créer mon compte</Text>
      </TouchableOpacity>

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
          <Text style={{color: '#34D399', fontWeight: 'bold'}}>Connectez-vous</Text>
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
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    height: 50,
    paddingRight: 10,
  },
  legalText: {
    fontSize: 13,
    color: 'grey',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 20,
  },
  legalLink: {
    color: '#34D399',
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#34D399',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
