import fs from "fs";
import path from "path";
import { buildEmailTemplate } from "../src/email/email.js";

const html = buildEmailTemplate({
  title: "Test Email — Localiz",
  preheader: "Prévisualisation du template d'email de Localiz",
  heading: "Prévisualisation",
  bodyHtml:
    "<p>Ceci est un aperçu du nouvel email. Le bouton ci-dessous doit utiliser la couleur primaire du site.</p>",
  ctaText: "Aller sur Localiz",
  ctaUrl: "https://localiz.test",
});

const out = path.join(process.cwd(), "server", "tmp", "sample-email.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, "utf8");
console.log("Wrote sample email to", out);
