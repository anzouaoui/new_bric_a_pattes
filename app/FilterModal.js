import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import RangeSlider from 'react-native-range-slider';

const categories = [
  { id: 'transport', name: 'Transport', icon: 'car' },
  { id: 'tools', name: 'Outils', icon: 'tools' },
  { id: 'furniture', name: 'Mobilier', icon: 'couch' },
  { id: 'toys', name: 'Jouets', icon: 'gamepad' },
  { id: 'garden', name: 'Jardinage', icon: 'leaf' },
  { id: 'sports', name: 'Sport', icon: 'running' },
  { id: 'electronics', name: 'Électronique', icon: 'tv' },
  { id: 'clothing', name: 'Vêtements', icon: 'tshirt' },
];

const FilterModal = ({ isVisible, onClose, onApplyFilters }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([5, 50]);
  const [postalCode, setPostalCode] = useState('');
  const [filterCount, setFilterCount] = useState(0);

  // Mettre à jour le compteur de filtres actifs
  useEffect(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (priceRange[0] !== 5 || priceRange[1] !== 50) count += 1;
    if (postalCode.trim() !== '') count += 1;
    setFilterCount(count);
  }, [selectedCategories, priceRange, postalCode]);

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handlePriceChange = (low, high) => {
    setPriceRange([low, high]);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange([5, 50]);
    setPostalCode('');
  };

  const handleApplyFilters = () => {
    onApplyFilters({
      categories: selectedCategories,
      priceRange,
      postalCode: postalCode.trim()
    });
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Filtrer les résultats</Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.resetText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Section Catégories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategories.includes(category.id) && styles.categoryChipSelected
                  ]}
                  onPress={() => toggleCategory(category.id)}
                >
                  <FontAwesome5 
                    name={category.icon} 
                    size={16} 
                    color={selectedCategories.includes(category.id) ? '#34D399' : '#6B7280'} 
                    style={styles.categoryIcon} 
                  />
                  <Text 
                    style={[
                      styles.categoryText,
                      selectedCategories.includes(category.id) && styles.categoryTextSelected
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section Fourchette de prix */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fourchette de prix</Text>
            <View style={styles.sliderContainer}>
              <RangeSlider
                min={0}
                max={100}
                low={priceRange[0]}
                high={priceRange[1]}
                rangeEnabled={true}
                onValueChanged={(low, high) => handlePriceChange(low, high)}
                style={styles.slider}
                selectionColor="#34D399"
                blankColor="#E5E7EB"
                thumbBorderColor="#34D399"
                thumbColor="#FFFFFF"
              />
              <View style={styles.priceRangeLabels}>
                <Text style={styles.priceText}>{priceRange[0]}€</Text>
                <Text style={styles.priceText}>{priceRange[1]}€</Text>
              </View>
            </View>
          </View>

          {/* Section Localisation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation</Text>
            <Text style={styles.subtitle}>Près de chez vous</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Entrez le code postal"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Feather name="map-pin" size={20} color="#9CA3AF" style={styles.inputIcon} />
            </View>
          </View>
        </ScrollView>

        {/* Bouton d'application des filtres */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>
              Appliquer les filtres {filterCount > 0 ? `(${filterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  resetText: {
    color: '#34D399',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipSelected: {
    backgroundColor: '#E0F2F1',
    borderColor: '#34D399',
    borderWidth: 1,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    color: '#4B5563',
    fontSize: 14,
  },
  categoryTextSelected: {
    color: '#047857',
    fontWeight: '600',
  },
  sliderContainer: {
    marginTop: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  priceRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceText: {
    color: '#4B5563',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    height: 50,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#111827',
  },
  inputIcon: {
    marginLeft: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#34D399',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FilterModal;
