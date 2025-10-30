// Fichier: functions/index.js (Syntaxe V2)

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
const db = admin.firestore();

// On lit la clé depuis les variables d'environnement (fichier .env)
// Cela fonctionnera au moment du déploiement.
const SENDGRID_API_KEY = "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";
sgMail.setApiKey(SENDGRID_API_KEY);

// Définition de la fonction V2
exports.sendSupportEmail = onDocumentCreated(
  {
    // C'est ici qu'on définit la région et le document
    document: "supportTickets/{ticketId}",
    region: "europe-west1",
  },
  async (event) => {
    
    // 1. Récupérer les données du ticket
    const snap = event.data;
    if (!snap) {
      logger.warn("Aucune donnée trouvée dans l'événement, annulation.");
      return;
    }
    const ticketData = snap.data();

    // 2. Préparer l'e-mail
    const msg = {
      to: "devmobflutterflow@gmail.com", // TON ADRESSE DE SUPPORT
      from: "noreply@bricapattes.com", // Une adresse vérifiée sur SendGrid
      replyTo: ticketData.userEmail,
      subject: `[Nouveau Ticket Support] - ${ticketData.subject}`,
      
      html: `
        <p><strong>De:</strong> ${ticketData.userEmail} (UID: ${ticketData.userId})</p>
        <p><strong>Sujet:</strong> ${ticketData.subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${ticketData.message}</p>
        <hr>
        <p><strong>Pièce jointe:</strong> ${ticketData.attachmentUrl || "Aucune"}</p>
      `,
    };

    // 3. Envoyer l'e-mail
    try {
      logger.info(`Envoi de l'e-mail pour le ticket: ${event.params.ticketId}`);
      await sgMail.send(msg);
      logger.info("E-mail envoyé avec succès !");
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'e-mail:", error);
    }
  }
);

/**
 * Fonction Cloud pour traiter une commande de manière atomique
 * @param {Object} data - Données de la commande
 * @param {Object} context - Contexte d'authentification
 * @returns {Promise<Object>} Résultat de la commande
 */
exports.processOrder = onCall({
  region: 'europe-west1',
  cors: true,
  enforceAppCheck: true, // Optionnel : pour une sécurité renforcée
  memory: '1GB', // Augmenter la mémoire si nécessaire
}, async (request) => {
  // 1. Vérification de l'authentification
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté pour effectuer cette action.');
  }

  const { listingId, sellerId, buyerId, orderData } = request.data;
  
  // 2. Validation des données d'entrée
  if (!listingId || !sellerId || !buyerId || !orderData) {
    throw new HttpsError('invalid-argument', 'Données de commande manquantes.');
  }

  if (request.auth.uid !== buyerId) {
    throw new HttpsError('permission-denied', 'Non autorisé à effectuer cette action.');
  }

  try {
    // 3. Exécution de la transaction atomique
    const result = await db.runTransaction(async (transaction) => {
      const listingRef = db.collection('listings').doc(listingId);
      const orderRef = db.collection('orders').doc();
      
      // 4. Vérifier que l'annonce existe et n'est pas vendue
      const listingDoc = await transaction.get(listingRef);
      if (!listingDoc.exists) {
        throw new HttpsError('not-found', 'Annonce non trouvée.');
      }
      
      const listingData = listingDoc.data();
      if (listingData.status === 'sold') {
        throw new HttpsError('failed-precondition', 'Cette annonce a déjà été vendue.');
      }

      // 5. Préparer les données de la commande
      const now = admin.firestore.FieldValue.serverTimestamp();
      const order = {
        ...orderData,
        id: orderRef.id,
        listingId,
        sellerId,
        buyerId,
        status: 'pending_payment',
        paymentStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      // 6. Mettre à jour l'annonce et créer la commande dans une transaction atomique
      transaction.update(listingRef, {
        status: 'reserved',
        updatedAt: now,
        reservedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes pour le paiement
      });

      transaction.set(orderRef, order);

      return { orderId: orderRef.id };
    });

    // 7. Retourner le résultat au client
    return { 
      success: true, 
      orderId: result.orderId,
      message: 'Commande créée avec succès. Veuillez procéder au paiement.'
    };

  } catch (error) {
    logger.error('Erreur lors du traitement de la commande:', error);
    
    // Gérer les erreurs spécifiques
    if (error.code === 'failed-precondition') {
      throw new HttpsError('failed-precondition', error.message);
    }
    if (error.code === 'not-found') {
      throw new HttpsError('not-found', error.message);
    }
    
    // Erreur générique
    throw new HttpsError('internal', 'Une erreur est survenue lors du traitement de votre commande.');
  }
});