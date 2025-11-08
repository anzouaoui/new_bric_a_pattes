import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // <--- MODIFICATION 1: Importer useRouter
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 32 - (CARD_MARGIN * 4)) / 2;

// Liste des catégories avec leurs icônes
const CATEGORIES = [
  { id: 'jouets', name: 'Jouets', icon: <FontAwesome5 name="bone" size={20} /> },
  { id: 'laisses', name: 'Laisses & Colliers', icon: <MaterialCommunityIcons name="leash" size={24} /> },
  { id: 'couchages', name: 'Couchages', icon: <FontAwesome5 name="bed" size={20} /> },
  { id: 'vetements', name: 'Vêtements', icon: <FontAwesome5 name="tshirt" size={20} /> },
  { id: 'gamelles', name: 'Gamelles', icon: <MaterialCommunityIcons name="bowl-mix" size={24} /> },
  { id: 'transport', name: 'Transport', icon: <FontAwesome5 name="car-side" size={20} /> },
  { id: 'soins', name: 'Soins', icon: <MaterialCommunityIcons name="medical-bag" size={24} /> },
  { id: 'autre', name: 'Autre', icon: <MaterialCommunityIcons name="dots-horizontal" size={24} /> },
];

// <--- MODIFICATION 2: Retirer { navigation } des props
const SelectCategoryScreen = () => {
  const router = useRouter(); // <--- MODIFICATION 2: Appeler le hook
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleNext = () => {
    if (selectedCategory) {
      // <--- MODIFICATION 3: Utiliser router.push avec les paramètres
      router.push({
        pathname: 'AddDetailsScreen', // Navigue vers 'app/(sell-stack)/add-details.js'
        params: { category: selectedCategory }
      });
    }
  };

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategory === item.id;
    const itemColor = isSelected ? '#95ba72' : '#000';

    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          {
            borderColor: isSelected ? '#95ba72' : '#E0E0E0',
            backgroundColor: isSelected ? '#E0F2F1' : 'white',
            borderWidth: isSelected ? 2 : 1.5,
          }
        ]}
        onPress={() => setSelectedCategory(item.id)}
      >
        {React.cloneElement(item.icon, { color: itemColor })}
        <Text style={[styles.categoryText, { color: itemColor }]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        {/* <--- MODIFICATION 3: Utiliser router.back() */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choisir une catégorie</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        <Text style={styles.title}>Quelle est la catégorie de votre article ?</Text>
        
        {/* Grille des catégories */}
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.categoriesContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Pied de page avec bouton Suivant */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedCategory && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!selectedCategory}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ... (les styles restent inchangés) ...
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
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    flex: 1,
  },
  headerPlaceholder: {
    width: 32, // Même largeur que le bouton de retour pour centrer le titre
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#111827',
  },
  categoriesContainer: {
    paddingBottom: 24,
  },
  categoryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    margin: 8,
    minWidth: CARD_WIDTH,
  },
  categoryChipSelected: {
    backgroundColor: '#E0F2F1',
    borderColor: '#95ba72',
    borderWidth: 2,
  },
  categoryText: {
    marginLeft: 12,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: 'white',
  },
  nextButton: {
    backgroundColor: '#95ba72',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#A0D9C1',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SelectCategoryScreen;