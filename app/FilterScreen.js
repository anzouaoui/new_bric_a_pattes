import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const categories = [
  { id: 'transport', name: 'Transport', icon: 'truck-delivery' },
  { id: 'jouets', name: 'Jouets', icon: 'toy-basket' },
  { id: 'couchage', name: 'Couchage', icon: 'bed-king' },
  { id: 'puériculture', name: 'Puériculture', icon: 'baby-carriage' },
  { id: 'mobilier', name: 'Mobilier', icon: 'table-furniture' },
  { id: 'vêtements', name: 'Vêtements', icon: 'tshirt-crew' },
];

export default function FilterScreen({ navigation, route }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([5, 50]);
  const [postalCode, setPostalCode] = useState('');

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange([5, 50]);
    setPostalCode('');
  };

  const applyFilters = () => {
    // Pass filters back to HomeScreen
    navigation.navigate('Home', {
      filters: {
        categories: selectedCategories,
        priceRange,
        postalCode
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filtrer les résultats</Text>
        <TouchableOpacity onPress={resetFilters}>
          <Text style={styles.resetText}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(category.id) && styles.selectedCategoryChip
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <MaterialCommunityIcons 
                  name={category.icon} 
                  size={16} 
                  color={selectedCategories.includes(category.id) ? '#95ba72' : '#6B7280'} 
                  style={styles.categoryIcon}
                />
                <Text 
                  style={[
                    styles.categoryText,
                    selectedCategories.includes(category.id) && styles.selectedCategoryText
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fourchette de prix</Text>
          <View style={styles.priceRangeContainer}>
            <Text style={styles.priceText}>{priceRange[0]}€</Text>
            <View style={styles.sliderContainer}>
              <MultiSlider
                values={priceRange}
                onValuesChange={setPriceRange}
                min={0}
                max={150}
                step={5}
                allowOverlap
                minMarkerOverlapDistance={10}
                selectedStyle={styles.selectedTrack}
                trackStyle={styles.track}
                markerStyle={styles.marker}
                containerStyle={styles.slider}
              />
            </View>
            <Text style={styles.priceText}>{priceRange[1]}€</Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <Text style={styles.subtitle}>Près de chez vous</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Entrez le code postal"
              keyboardType="numeric"
              value={postalCode}
              onChangeText={setPostalCode}
              maxLength={5}
            />
            <Feather name="map-pin" size={20} color="#9CA3AF" />
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
          <Text style={styles.applyButtonText}>
            Appliquer les filtres{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ''}
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetText: {
    fontSize: 16,
    color: '#95ba72',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  subtitle: {
    color: 'grey',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    margin: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryChip: {
    borderColor: '#95ba72',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    color: '#4B5563',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#10B981',
    fontWeight: '600',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 10,
  },
  priceText: {
    fontSize: 16,
    color: '#4B5563',
    minWidth: 40,
    textAlign: 'center',
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  slider: {
    height: 40,
  },
  track: {
    backgroundColor: '#E5E7EB',
    height: 4,
    borderRadius: 2,
  },
  selectedTrack: {
    backgroundColor: '#95ba72',
  },
  marker: {
    backgroundColor: '#95ba72',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    marginRight: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#95ba72',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
