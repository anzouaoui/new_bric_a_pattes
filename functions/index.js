// Fichier : functions/index.js

// 1. Initialisation des modules Firebase Admin
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// ⚠️ INITIALISATION CRITIQUE DE L'ADMIN SDK
// Cette ligne doit être appelée une seule fois.
// Elle permet à la fonction de communiquer avec votre base de données et de valider les jetons.
admin.initializeApp();

const db = admin.firestore();
const HttpsError = functions.https.HttpsError; // Raccourci pour les erreurs

// 2. Définition de la Cloud Function
exports.processOrder = functions.https.onCall(async (data, context) => {
    // Log de débogage initial
    console.log('[CF_DEBUG] Données brutes reçues:', JSON.stringify({
        data,
        auth: context.auth ? 'Authentifié' : 'Non authentifié'
    }, null, 2));
    // --- VÉRIFICATION D'AUTHENTIFICATION CÔTÉ SERVEUR (Obligatoire pour Https.onCall) ---
    // Si context.auth est manquant, le jeton est invalide ou l'utilisateur n'est pas connecté.
    if (!context.auth) {
        // Renvoie une erreur standard Firebase qui sera attrapée par le client
        throw new HttpsError('unauthenticated', 'L\'utilisateur doit être connecté pour effectuer cette action.');
    }

    const buyerId = context.auth.uid; // Utilise l'UID validé par Firebase
    const { listingId, sellerId, orderData } = data; // Récupère les données du client

    // Log des IDs reçus
    console.log(`[CF_DEBUG] IDs reçus:`, {
        listingId: `${listingId} (type: ${typeof listingId})`,
        sellerId: `${sellerId} (type: ${typeof sellerId})`,
        buyerId: `${buyerId} (type: ${typeof buyerId})`,
        hasOrderData: !!orderData
    });

    // Vérification des données requises
    if (!listingId || !sellerId || !orderData) {
        console.log('[CF_DEBUG] Données manquantes:', { 
            hasListingId: !!listingId, 
            hasSellerId: !!sellerId, 
            hasOrderData: !!orderData 
        });
        throw new HttpsError('invalid-argument', 'Les données de commande sont incomplètes.');
    }

    // ⚠️ Première vérification critique : l'ID validé correspond-il à l'acheteur ? (Sécurité)
    if (buyerId !== orderData.buyerId) {
        console.log('[CF_DEBUG] Incohérence des IDs:', {
            buyerIdFromToken: buyerId,
            buyerIdFromOrder: orderData.buyerId
        });
        throw new HttpsError('permission-denied', 'L\'ID de l\'utilisateur authentifié ne correspond pas à l\'ID de l\'acheteur.');
    }
    
    try {
      // Log avant la transaction
        console.log(`[CF_DEBUG] Début de la transaction pour le listing: ${listingId}`);
        // --- LOGIQUE DE TRANSACTION FIRESTORE ---
        await db.runTransaction(async (transaction) => {
            const listingRef = db.doc(`listings/${listingId}`);
            const listingSnapshot = await transaction.get(listingRef);

            if (!listingSnapshot.exists) {
                console.error(`Listing non trouvé pour l'ID: ${listingId}`);
                throw new HttpsError('not-found', "L'annonce est introuvable ou a été supprimée.");
            }

            const listing = listingSnapshot.data();
            if (listing.isSold || listing.status === 'sold') {
                throw new HttpsError('unavailable', 'Cette annonce a déjà été vendue ou n\'est plus disponible.');
            }

            // Créer la commande
            const newOrderRef = db.collection('orders').doc();
            const newOrder = {
                ...orderData,
                buyerId: buyerId, // Utilise l'ID validé
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            transaction.set(newOrderRef, newOrder);

            // Marquer l'annonce comme vendue
            transaction.update(listingRef, {
                isSold: true,
                soldTo: buyerId,
                status: 'reserved', // Ou 'sold', selon votre workflow
                soldAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Retourne l'ID de la commande au client
            return { success: true, orderId: newOrderRef.id };
        });
        
        // Le résultat de la transaction est automatiquement renvoyé

    } catch (error) {
        // Log de l'erreur interne
        console.error('Erreur transactionnelle processOrder:', error.code || error.message);
        
        // Renvoyer l'erreur au client pour affichage
        if (error.code) {
             throw error; // Renvoie l'erreur HttpsError
        } else {
             // Si c'est une erreur générique, la renvoyer comme une erreur interne
             throw new HttpsError('internal', 'Erreur serveur inconnue.', error.message);
        }
    }
});