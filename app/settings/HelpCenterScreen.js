import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

// Données statiques pour la FAQ (à remplacer par un appel Firestore si nécessaire)
const FAQ_DATA = [
  {
    id: '1',
    category: 'Achat',
    question: 'Comment acheter un article ?',
    answer: 'Pour acheter un article, sélectionnez-le, puis cliquez sur "Acheter". Suivez ensuite les étapes de paiement sécurisé.'
  },
  {
    id: '2',
    category: 'Achat',
    question: 'Quels sont les modes de paiement acceptés ?',
    answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal et les virements bancaires.'
  },
  {
    id: '3',
    category: 'Vente',
    question: 'Comment vendre un article ?',
    answer: 'Cliquez sur l\'icône "+" en bas de l\'écran, prenez des photos de votre article, renseignez les détails et publiez l\'annonce.'
  },
  {
    id: '4',
    category: 'Vente',
    question: 'Quand serai-je payé ?',
    answer: 'Le paiement est effectué sous 2 à 3 jours ouvrables après la livraison et la confirmation de réception par l\'acheteur.'
  },
  {
    id: '5',
    category: 'Mon Compte',
    question: 'Comment modifier mon mot de passe ?',
    answer: 'Allez dans Paramètres > Sécurité > Modifier le mot de passe et suivez les instructions.'
  },
  {
    id: '6',
    category: 'Mon Compte',
    question: 'Comment supprimer mon compte ?',
    answer: 'Contactez notre service client via le formulaire de contact pour demander la suppression de votre compte.'
  },
];

const CATEGORIES = ['Tout', 'Achat', 'Vente', 'Mon Compte'];

// Composant Accordéon pour les questions/réponses
const AccordionItem = ({ item, isExpanded, onPress }) => (
  <View style={styles.accordionItem}>
    <TouchableOpacity 
      style={styles.accordionHeader} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.accordionQuestion}>{item.question}</Text>
      <Ionicons 
        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
        size={20} 
        color="#4B5563" 
      />
    </TouchableOpacity>
    {isExpanded && (
      <View style={styles.accordionContent}>
        <Text style={styles.accordionAnswer}>{item.answer}</Text>
      </View>
    )}
  </View>
);

export default function HelpCenterScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  // Filtrer les questions par catégorie et recherche
  const filteredQuestions = FAQ_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'Tout' || item.category === selectedCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & FAQ</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une question..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Filtres par catégorie */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text 
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextSelected
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Questions fréquentes</Text>

        {/* Liste des questions */}
        <View style={styles.accordionContainer}>
          {filteredQuestions.map((item) => (
            <AccordionItem
              key={item.id}
              item={item}
              isExpanded={expandedQuestionId === item.id}
              onPress={() => toggleAccordion(item.id)}
            />
          ))}
        </View>

        {/* Bloc contacter le support */}
        <View style={styles.contactSupport}>
          <Text style={styles.contactTitle}>Vous ne trouvez pas votre réponse ?</Text>
          <Text style={styles.contactSubtitle}>Une autre question ? Notre équipe est là pour vous aider.</Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => router.push('/settings/contact-support')}
          >
            <Text style={styles.contactButtonText}>Contacter le support</Text>
          </TouchableOpacity>
        </View>

        {/* Liens légaux */}
        <View style={styles.legalLinks}>
          <Text style={styles.legalText}>
            Conditions Générales d'Utilisation • Politique de confidentialité • Mentions Légales
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
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
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    margin: 16,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  categoriesContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#D1FAE5',
  },
  categoryText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#059669',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 16,
    color: '#111827',
  },
  accordionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  accordionItem: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accordionQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
  },
  accordionContent: {
    padding: 16,
    paddingTop: 0,
  },
  accordionAnswer: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  contactSupport: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
    margin: 16,
    borderRadius: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#111827',
  },
  contactSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  legalLinks: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  legalText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
};
