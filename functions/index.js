// Fichier: functions/index.js

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

const SENDGRID_API_KEY = "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";
sgMail.setApiKey(SENDGRID_API_KEY);

// ==========================================
// NOUVELLE FONCTION : Process Order
// ==========================================
exports.processOrder = onCall(
  {
    region: "europe-west1",
  },
  async (request) => {
    try {
      // 1. Vérifier l'authentification
      if (!request.auth) {
        throw new Error("Unauthenticated: Vous devez être connecté pour effectuer cette action");
      }

      const userId = request.auth.uid;
      const orderData = request.data;

      logger.info("Traitement de la commande pour l'utilisateur:", userId);
      logger.info("Données de la commande:", orderData);

      // 2. Validation des données
      if (!orderData.listingId || !orderData.sellerId || !orderData.total) {
        throw new Error("Données de commande manquantes");
      }

      // 3. Vérifier que l'utilisateur ne peut pas acheter son propre article
      if (userId === orderData.sellerId) {
        throw new Error("Vous ne pouvez pas acheter votre propre article");
      }

      const db = admin.firestore();

      // 4. Vérifier que l'annonce existe et est disponible
      const listingRef = db.collection('listings').doc(orderData.listingId);
      const listingDoc = await listingRef.get();

      if (!listingDoc.exists) {
        throw new Error("L'annonce n'existe plus");
      }

      const listingData = listingDoc.data();

      if (listingData.status === 'sold' || listingData.status === 'reserved') {
        throw new Error("Cette annonce n'est plus disponible");
      }

      // 5. Créer la commande avec un ID généré automatiquement
      const orderRef = db.collection('orders').doc();
      const orderId = orderRef.id;

      const completeOrderData = {
        ...orderData,
        orderId: orderId,
        buyerId: userId,
        status: 'pending_payment',
        paymentStatus: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // 6. Transaction atomique pour créer la commande et réserver l'annonce
      await db.runTransaction(async (transaction) => {
        // Relire l'annonce dans la transaction pour éviter les conditions de course
        const freshListingDoc = await transaction.get(listingRef);
        
        if (!freshListingDoc.exists) {
          throw new Error("L'annonce n'existe plus");
        }

        const freshListingData = freshListingDoc.data();
        
        if (freshListingData.status === 'sold' || freshListingData.status === 'reserved') {
          throw new Error("Cette annonce a été vendue entre-temps");
        }

        // Créer la commande
        transaction.set(orderRef, completeOrderData);

        // Réserver l'annonce
        transaction.update(listingRef, {
          status: 'reserved',
          reservedAt: admin.firestore.FieldValue.serverTimestamp(),
          reservedBy: userId,
          orderId: orderId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      // 7. Simuler le paiement (à remplacer par Stripe/RevenueCat plus tard)
      logger.info("Simulation du paiement...");
      
      // Attendre 1.5 secondes pour simuler le traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 8. Mettre à jour le statut après paiement réussi
      await orderRef.update({
        status: 'paid',
        paymentStatus: 'completed',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 9. Mettre à jour le statut de l'annonce
      await listingRef.update({
        status: 'sold',
        soldAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info("Commande traitée avec succès:", orderId);

      // 10. Retourner le résultat
      return {
        success: true,
        orderId: orderId,
        message: "Commande créée avec succès"
      };

    } catch (error) {
      logger.error("Erreur lors du traitement de la commande:", error);
      
      // Retourner l'erreur au client
      return {
        success: false,
        error: error.message || "Une erreur est survenue lors du traitement de la commande"
      };
    }
  }
);

// ==========================================
// FONCTION EXISTANTE : Send Support Email
// ==========================================
exports.sendSupportEmail = onDocumentCreated(
  {
    document: "supportTickets/{ticketId}",
    region: "europe-west1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.warn("Aucune donnée trouvée dans l'événement, annulation.");
      return;
    }
    const ticketData = snap.data();

    const msg = {
      to: "devmobflutterflow@gmail.com",
      from: "noreply@bricapattes.com",
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

    try {
      logger.info(`Envoi de l'e-mail pour le ticket: ${event.params.ticketId}`);
      await sgMail.send(msg);
      logger.info("E-mail envoyé avec succès !");
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'e-mail:", error);
    }
  }
);