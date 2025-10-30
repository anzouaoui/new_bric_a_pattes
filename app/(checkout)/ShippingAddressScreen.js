import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

// Composant réutilisable pour les champs de formulaire
const FormField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', style }) => (
  <View style={[styles.formGroup, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
    />
  </View>
);

// Composant pour la checkbox
const Checkbox = ({ value, onValueChange, label }) => (
  <TouchableOpacity 
    style={styles.checkboxContainer} 
    onPress={() => onValueChange(!value)}
  >
    <View style={[styles.checkbox, value && styles.checked]}>
      {value && <Ionicons name="checkmark" size={16} color="white" />}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function ShippingAddressScreen() {
  const router = useRouter();
  const { listingId, total } = useLocalSearchParams();
  
  // États du formulaire
  const [deliveryMethod, setDeliveryMethod] = useState('domicile');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');
  const [saveAddress, setSaveAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Charger l'adresse enregistrée de l'utilisateur
  useEffect(() => {
    const loadUserAddress = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().shippingAddress) {
          const address = userDoc.data().shippingAddress;
          setFirstName(address.firstName || '');
          setLastName(address.lastName || '');
          setAddressLine1(address.addressLine1 || '');
          setAddressLine2(address.addressLine2 || '');
          setPostalCode(address.postalCode || '');
          setCity(address.city || '');
          setCountry(address.country || 'France');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'adresse:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserAddress();
  }, []);

  // Sauvegarder l'adresse de l'utilisateur
  const saveUserAddress = async () => {
    if (!auth.currentUser) return;

    const address = {
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      postalCode,
      city,
      country,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        shippingAddress: address
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'adresse:', error);
    }
  };

  // Gérer le paiement
  const handlePay = async () => {
    // Validation des champs obligatoires
    if (deliveryMethod === 'domicile' && (!firstName || !lastName || !addressLine1 || !postalCode || !city)) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Non connecté', 'Veuvez-vous connecter pour effectuer un achat');
      return;
    }

    setPaymentLoading(true);

    try {
      // 1. Sauvegarder l'adresse si demandé
      if (saveAddress) {
        await saveUserAddress();
      }

      // 2. Récupérer les détails de l'annonce
      const listingDoc = await getDoc(doc(db, 'listings', listingId));
      if (!listingDoc.exists()) {
        throw new Error("L'annonce n'existe plus");
      }
      const listingData = listingDoc.data();

      // 3. Vérifier si l'annonce est toujours disponible
      if (listingData.status === 'sold' || listingData.status === 'reserved') {
        throw new Error("Désolé, cette annonce n'est plus disponible");
      }

      // 4. Créer l'objet de commande
      const orderData = {
        listingId,
        sellerId: listingData.userId,
        buyerId: auth.currentUser.uid,
        buyerName: auth.currentUser.displayName || auth.currentUser.email,
        listingTitle: listingData.title,
        listingPrice: listingData.price,
        listingImage: listingData.imageUrls?.[0] || null,
        amount: parseFloat(total),
        status: 'pending_payment',
        paymentStatus: 'pending',
        deliveryMethod,
        shippingAddress: deliveryMethod === 'domicile' ? {
          firstName,
          lastName,
          addressLine1,
          addressLine2,
          postalCode,
          city,
          country
        } : { 
          method: 'pickup',
          pickupAddress: listingData.pickupAddress || 'À définir avec le vendeur'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 5. Démarrer une transaction batch pour des opérations atomiques
      const batch = writeBatch(db);
      
      // 6. Référence du document de commande
      const orderRef = doc(collection(db, 'orders'));
      
      // 7. Ajouter la commande au batch
      batch.set(orderRef, orderData);
      
      // 8. Mettre à jour le statut de l'annonce
      batch.update(doc(db, 'listings', listingId), {
        status: 'reserved',
        reservedAt: new Date().toISOString(),
        reservedBy: auth.currentUser.uid,
        orderId: orderRef.id,
        updatedAt: new Date().toISOString()
      });
      
      // 9. Exécuter la transaction
      await batch.commit();

      // 10. Simuler le processus de paiement (à remplacer par votre logique de paiement)
      try {
        // Ici, vous intégrerez votre solution de paiement (Stripe, PayPal, etc.)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mise à jour du statut après paiement réussi
        await updateDoc(orderRef, {
          status: 'paid',
          paymentStatus: 'completed',
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // Mettre à jour le statut de l'annonce
        await updateDoc(doc(db, 'listings', listingId), {
          status: 'sold',
          soldAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log('Paiement réussi, commande créée:', orderRef.id);
        
        // Rediriger vers l'écran de succès avec l'ID de commande
        router.replace(`/(checkout)/PaymentSuccessScreen?orderId=${orderRef.id}`);
        
      } catch (paymentError) {
        console.error('Erreur lors du paiement:', paymentError);
        
        // En cas d'échec du paiement, mettre à jour le statut
        await updateDoc(orderRef, {
          status: 'payment_failed',
          paymentStatus: 'failed',
          updatedAt: new Date().toISOString(),
          error: paymentError.message
        });
        
        // Libérer la réservation de l'annonce
        await updateDoc(doc(db, 'listings', listingId), {
          status: 'available',
          reservedAt: null,
          reservedBy: null,
          orderId: null,
          updatedAt: new Date().toISOString()
        });
        
        throw new Error('Le paiement a échoué. Veuillez réessayer ou utiliser un autre moyen de paiement.');
      }
      
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      Alert.alert(
        'Erreur de paiement', 
        error.message || 'Une erreur est survenue lors du traitement du paiement.'
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // Afficher un indicateur de chargement pendant le chargement initial
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Livraison</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Sélecteur de méthode de livraison */}
          <View style={styles.deliveryMethodContainer}>
            <TouchableOpacity
              style={[
                styles.deliveryMethodButton,
                deliveryMethod === 'domicile' && styles.deliveryMethodButtonActive
              ]}
              onPress={() => setDeliveryMethod('domicile')}
            >
              <Ionicons 
                name="home-outline" 
                size={20} 
                color={deliveryMethod === 'domicile' ? '#34D399' : '#6B7280'} 
              />
              <Text 
                style={[
                  styles.deliveryMethodText,
                  deliveryMethod === 'domicile' && styles.deliveryMethodTextActive
                ]}
              >
                Livraison à domicile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deliveryMethodButton,
                deliveryMethod === 'pickup' && styles.deliveryMethodButtonActive
              ]}
              onPress={() => setDeliveryMethod('pickup')}
            >
              <Ionicons 
                name="storefront-outline" 
                size={20} 
                color={deliveryMethod === 'pickup' ? '#34D399' : '#6B7280'} 
              />
              <Text 
                style={[
                  styles.deliveryMethodText,
                  deliveryMethod === 'pickup' && styles.deliveryMethodTextActive
                ]}
              >
                Retrait en magasin
              </Text>
            </TouchableOpacity>
          </View>

          {deliveryMethod === 'domicile' ? (
            <>
              <Text style={styles.sectionTitle}>Saisissez votre adresse</Text>
              
              <View style={styles.row}>
                <FormField
                  label="Prénom"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Jean"
                  style={{ flex: 1, marginRight: 8 }}
                />
                <FormField
                  label="Nom"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Dupont"
                  style={{ flex: 1 }}
                />
              </View>

              <FormField
                label="Adresse"
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="123 rue de l'exemple"
              />

              <FormField
                label="Complément d'adresse (optionnel)"
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="Appartement, étage, etc."
              />

              <View style={styles.row}>
                <FormField
                  label="Code postal"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="75000"
                  keyboardType="numeric"
                  style={{ flex: 1, marginRight: 8 }}
                />
                <FormField
                  label="Ville"
                  value={city}
                  onChangeText={setCity}
                  placeholder="Paris"
                  style={{ flex: 2 }}
                />
              </View>

              <FormField
                label="Pays"
                value={country}
                onChangeText={setCountry}
                placeholder="France"
              />

              <Checkbox
                value={saveAddress}
                onValueChange={setSaveAddress}
                label="Enregistrer cette adresse pour plus tard"
              />
            </>
          ) : (
            <View style={styles.pickupInfo}>
              <Ionicons name="storefront" size={48} color="#34D399" style={styles.pickupIcon} />
              <Text style={styles.pickupTitle}>Retrait en magasin</Text>
              <Text style={styles.pickupAddress}>
                123 Rue du Commerce{'\n'}75000 Paris, France
              </Text>
              <Text style={styles.pickupHours}>
                Horaires d'ouverture :{'\n'}Lun-Ven: 10h-19h{'\n'}Sam: 10h-20h
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pied de page avec bouton de paiement */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{parseFloat(total).toFixed(2)} €</Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, (paymentLoading || loading) && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={paymentLoading || loading}
        >
          {paymentLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.payButtonText}>
              Payer {parseFloat(total).toFixed(2)} €
            </Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Pour éviter que le contenu ne soit caché par le footer
  },
  deliveryMethodContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  deliveryMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deliveryMethodButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deliveryMethodText: {
    marginLeft: 8,
    color: '#6B7280',
    fontWeight: '500',
  },
  deliveryMethodTextActive: {
    color: '#34D399',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checked: {
    backgroundColor: '#34D399',
    borderColor: '#34D399',
  },
  checkboxLabel: {
    color: '#4B5563',
    fontSize: 14,
  },
  pickupInfo: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 8,
  },
  pickupIcon: {
    marginBottom: 12,
  },
  pickupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickupAddress: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  pickupHours: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: 'white',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  payButton: {
    backgroundColor: '#34D399',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
