  import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db, storage } from '../../firebaseConfig';

  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  const DetailChip = ({ icon, label, value }) => (
    <View style={styles.detailChip}>
      <View style={styles.detailIconContainer}>
        <Ionicons name={icon} size={20} color="#95ba72" />
      </View>
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  export default function ReviewListingScreen() {
    const router = useRouter();
    const localSearchParams = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const { currentUser } = getAuth();
    
    // Parse the images from the URL parameters
    const images = JSON.parse(localSearchParams.images || '[]');

    const handlePublish = async () => {
    if (!currentUser) {
      Alert.alert("Connexion requise", "Vous devez être connecté pour publier.");
      return;
    }

    setIsLoading(true);

    try {
      // --- ÉTAPE 1: UPLOAD DES IMAGES (STORAGE) ---
      const uploadedImageUrls = [];

      console.log("Démarrage de l'upload...");

      // Boucler sur chaque image locale
      for (const uri of images) {
        // Convertir l'image locale en fichier "blob"
        const response = await fetch(uri);
        const blob = await response.blob();

        // Créer un nom de fichier unique
        const filename = `${currentUser.uid}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const storageRef = ref(storage, `listings/${filename}`);

        // Uploader le blob
        await uploadBytes(storageRef, blob);

        // Récupérer l'URL de téléchargement publique
        const downloadURL = await getDownloadURL(storageRef);
        uploadedImageUrls.push(downloadURL);
      }

      console.log("Upload terminé. URLs:", uploadedImageUrls);

      // --- ÉTAPE 2: CRÉATION DU DOCUMENT (FIRESTORE) ---
      const listingData = {
        title: localSearchParams.title,
        description: localSearchParams.description,
        price: parseFloat(localSearchParams.price),
        category: localSearchParams.category,
        condition: localSearchParams.condition,
        postalCode: localSearchParams.postalCode,
        imageUrls: uploadedImageUrls,
        userId: currentUser.uid,
        userAvatar: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        status: 'available',
      };

      // Ajouter le document à la collection "listings" et récupérer la référence
      const docRef = await addDoc(collection(db, 'listings'), listingData);
      const newListingId = docRef.id;
      console.log("Document Firestore créé avec succès. ID:", newListingId);

      // --- ÉTAPE 3: REDIRECTION VERS L'ÉCRAN DE SUCCÈS ---
      setIsLoading(false);
      
      // Naviguer vers l'écran de succès avec l'ID de la nouvelle annonce
      router.replace({
        pathname: 'PublishSuccessScreen',
        params: { newListingId }
      });

    } catch (e) {
      setIsLoading(false);
      console.error("Erreur lors de la publication : ", e);
      Alert.alert(
        "Erreur de publication", 
        "Un problème est survenu. " + (e.message || "Veuillez réessayer plus tard.")
      );
    }
  };

    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aperçu de l'annonce</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Progress Bar (Hidden but good practice) */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Étape 3 sur 3</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>

          {/* Image Carousel */}
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
          >
            {images.map((uri, index) => (
              <Image 
                key={index} 
                source={{ uri }} 
                style={styles.carouselImage} 
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.title}>{localSearchParams.title}</Text>
            <Text style={styles.price}>{localSearchParams.price} €</Text>
            
            {/* Seller Card */}
            <View style={styles.sellerCard}>
              <Text style={styles.sellerName}>
                {currentUser?.displayName || 'Anonyme'}
              </Text>
              <Text style={styles.sellerRating}>⭐ 4.8</Text>
            </View>

            {/* Details Section */}
            <Text style={styles.sectionTitle}>Détails</Text>
            <View style={styles.detailsGrid}>
              <DetailChip 
                icon="pricetag-outline" 
                label="Catégorie" 
                value={localSearchParams.category} 
              />
              <DetailChip 
                icon="checkmark-circle-outline" 
                label="État" 
                value={localSearchParams.condition} 
              />
              <DetailChip 
                icon="location-outline" 
                label="Lieu" 
                value={`${localSearchParams.postalCode} (France)`} 
              />
            </View>

            {/* Description Section */}
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {localSearchParams.description}
            </Text>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.publishButton, isLoading && styles.disabledButton]}
            onPress={handlePublish}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.publishButtonText}>Publier l'annonce</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#EFEFEF',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 16,
    },
    headerPlaceholder: {
      width: 28,
    },
    scrollView: {
      flex: 1,
    },
    progressContainer: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
    },
    progressText: {
      color: 'grey',
      marginBottom: 4,
      fontSize: 14,
    },
    progressBar: {
      height: 8,
      backgroundColor: '#F3F4F6',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#95ba72',
      borderRadius: 4,
    },
    carousel: {
      height: 300,
    },
    carouselImage: {
      width: SCREEN_WIDTH,
      height: '100%',
    },
    infoSection: {
      padding: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    price: {
      fontSize: 24,
      color: '#95ba72',
      fontWeight: 'bold',
      marginBottom: 16,
    },
    sellerCard: {
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    sellerName: {
      fontSize: 16,
      fontWeight: '600',
    },
    sellerRating: {
      color: '#F59E0B',
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 24,
      marginBottom: 16,
    },
    detailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    detailChip: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    detailIconContainer: {
      backgroundColor: '#E0F2F1',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    detailLabel: {
      color: '#6B7280',
      fontSize: 12,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      color: '#4B5563',
      marginBottom: 100, // Extra space for the footer
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: '#EFEFEF',
    },
    editButton: {
      backgroundColor: '#E0F2F1',
      padding: 16,
      borderRadius: 12,
      width: '48%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    editButtonText: {
      color: '#047857',
      fontWeight: '600',
    },
    publishButton: {
      backgroundColor: '#95ba72',
      padding: 16,
      borderRadius: 12,
      width: '48%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    publishButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    disabledButton: {
      backgroundColor: '#A7F3D0',
    },
  });
