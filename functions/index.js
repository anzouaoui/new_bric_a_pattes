// Fichier: functions/index.js (Syntaxe V2)

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

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