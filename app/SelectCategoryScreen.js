import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 32 - (CARD_MARGIN * 4)) / 2;

// Liste des catégories avec leurs icônes
const CATEGORIES = [
  { id: 'transport', name: 'Transport', icon: 'car' },
  { id: 'tools', name: 'Outils', icon: 'tools' },
  { id: 'furniture', name: 'Mobilier', icon: 'couch' },
  { id: 'toys', name: 'Jouets', icon: 'gamepad' },
  { id: 'garden', name: 'Jardinage', icon: 'leaf' },
  { id: 'sports', name: 'Sport', icon: 'running' },
  { id: 'electronics', name: 'Électronique', icon: 'tv' },
  { id: 'clothing', name: 'Vêtements', icon: 'tshirt' },
  { id: 'books', name: 'Livres', icon: 'book' },
  { id: 'music', name: 'Instruments de musique', icon: 'music' },
  { id: 'pets', name: 'Animaux', icon: 'paw' },
  { id: 'other', name: 'Autre', icon: 'ellipsis-h' },
];

const SelectCategoryScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleNext = () => {
    if (selectedCategory) {
      navigation.navigate('AddDetailsScreen', { category: selectedCategory });
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipSelected
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <FontAwesome5 
        name={item.icon} 
        size={20} 
        color={selectedCategory === item.id ? '#95ba72' : '#4B5563'} 
      />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    margin: 8,
    minWidth: CARD_WIDTH,
    backgroundColor: 'white',
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
