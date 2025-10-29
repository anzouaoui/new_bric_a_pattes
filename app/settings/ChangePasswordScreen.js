import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import InputWithToggle from '../../components/InputWithToggle';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCurrentVisible, setIsCurrentVisible] = useState(false);
  const [isNewVisible, setIsNewVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChangePassword = async () => {
    setLoading(true);
    setError(null);

    // Validation
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("Utilisateur non connecté.");
      setLoading(false);
      return;
    }

    try {
      // 1. Créer les identifiants
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      // 2. Se ré-authentifier
      await reauthenticateWithCredential(user, credential);
      
      // 3. Mettre à jour le mot de passe
      await updatePassword(user, newPassword);
      
      Alert.alert("Succès", "Votre mot de passe a été mis à jour avec succès.");
      router.back();
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      
      if (error.code === 'auth/wrong-password') {
        setError("Le mot de passe actuel est incorrect.");
      } else if (error.code === 'auth/weak-password') {
        setError("Le nouveau mot de passe est trop faible. Utilisez au moins 6 caractères.");
      } else if (error.code === 'auth/requires-recent-login') {
        setError("Cette opération est sensible et nécessite une ré-authentification récente. Veuillez vous reconnecter et réessayer.");
      } else {
        setError(error.message || "Une erreur est survenue lors du changement de mot de passe.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      Alert.alert("E-mail envoyé", "Un lien de réinitialisation a été envoyé à votre adresse e-mail.");
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
      Alert.alert("Erreur", "Impossible d'envoyer l'email de réinitialisation. Veuillez réessayer plus tard.");
    }
  };

  const isFormValid = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Changer le mot de passe</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Changez votre mot de passe</Text>
        <Text style={styles.description}>
          Pour la sécurité de votre compte, veuillez entrer votre mot de passe actuel et définir un nouveau mot de passe.
        </Text>

        {/* Formulaire */}
        <InputWithToggle
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Mot de passe actuel"
          isPassword={true}
          isVisible={isCurrentVisible}
          onToggleVisibility={() => setIsCurrentVisible(!isCurrentVisible)}
          returnKeyType="next"
          autoCapitalize="none"
        />

        <InputWithToggle
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nouveau mot de passe"
          isPassword={true}
          isVisible={isNewVisible}
          onToggleVisibility={() => setIsNewVisible(!isNewVisible)}
          returnKeyType="next"
          autoCapitalize="none"
        />

        <InputWithToggle
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirmez le nouveau mot de passe"
          isPassword={true}
          isVisible={isConfirmVisible}
          onToggleVisibility={() => setIsConfirmVisible(!isConfirmVisible)}
          returnKeyType="done"
          autoCapitalize="none"
          error={error !== null || (confirmPassword && newPassword !== confirmPassword)}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {confirmPassword && newPassword !== confirmPassword && (
          <Text style={styles.errorText}>Les mots de passe ne correspondent pas.</Text>
        )}

        <TouchableOpacity
          style={[styles.button, !isFormValid && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Mettre à jour le mot de passe</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotPasswordButton}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: -8,
    marginBottom: 12,
  },
});
