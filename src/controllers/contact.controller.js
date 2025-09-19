import Contact from "../models/contact.schema.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const postContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const contact = await Contact.create({ name, email, subject, message });

    // Send notification email to support (best-effort)
    try {
      const supportEmail = process.env.SUPPORT_EMAIL || "support@localiz.fr";
      const clientUrl = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
      const bodyHtml = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <h2>Nouveau message de contact</h2>
          <p><strong>Nom:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Objet:</strong> ${subject}</p>
          <hr/>
          <div>${message.replace(/\n/g, "<br/>")}</div>
          <p style="margin-top:12px"><a href="${clientUrl}/admin/messages">Voir les messages</a></p>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: supportEmail,
        subject: `Nouveau message de contact: ${subject}`,
        html: bodyHtml,
      };

      await transporter.sendMail(mailOptions);
    } catch (err) {
      // don't block main response if email fails
      console.warn("Failed to send contact notification email:", err.message);
    }

    res.status(201).json({ ok: true, id: contact._id });
  } catch (err) {
    console.error("postContact error:", err);
    res.status(500).json({ message: "Impossible d'enregistrer le message" });
  }
};

export default { postContact };

export const listContacts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      50,
      Math.max(5, parseInt(req.query.limit || "20", 10))
    );
    const skip = (page - 1) * limit;
    // archived: 'true' => only archived, 'false' => only non-archived, undefined => all
    const archivedParam = req.query.archived;
    const archivedFilter =
      archivedParam === undefined ? {} : { archived: archivedParam === "true" };

    const [items, total] = await Promise.all([
      Contact.find(archivedFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(archivedFilter),
    ]);

    res.json({ items, total, page, limit });
  } catch (err) {
    console.error("listContacts error:", err);
    res.status(500).json({ message: "Impossible de récupérer les messages" });
  }
};

export const archiveContact = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID manquant" });
    const contact = await Contact.findByIdAndUpdate(id, { archived: true });
    if (!contact)
      return res.status(404).json({ message: "Message introuvable" });
    res.json({ ok: true });
  } catch (err) {
    console.error("archiveContact error:", err);
    res.status(500).json({ message: "Impossible d'archiver le message" });
  }
};

export const unarchiveContact = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID manquant" });
    const contact = await Contact.findByIdAndUpdate(id, { archived: false });
    if (!contact)
      return res.status(404).json({ message: "Message introuvable" });
    res.json({ ok: true });
  } catch (err) {
    console.error("unarchiveContact error:", err);
    res.status(500).json({ message: "Impossible de restaurer le message" });
  }
};
