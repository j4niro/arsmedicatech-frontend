# 🧠 ArsMedicaTech Frontend

Interface utilisateur du projet **ArsMedicaTech**, développée en **React + TypeScript**, permettant d’interagir avec le backend Flask et la base de données SurrealDB.

---

## 🚀 Installation et lancement

### 1️⃣ Cloner le projet
```bash
git clone https://github.com/<votre_repo>/arsmedicatech-frontend.git
cd arsmedicatech-frontend
###2️⃣ Installer les dépendances
```bash
npm install
###3️⃣ Ajouter la gestion multilingue
```bash
npm install i18next react-i18next i18next-browser-languagedetector
###4️⃣ Configurer l’environnement
Créer un fichier .env à la racine du projet avec le contenu suivant :
```bash
API_URL=http://localhost:5000
SENTRY_DSN=http://localhost:5000

🔹 API_URL : l’adresse du backend Flask
🔹 SENTRY_DSN : clé de surveillance des erreurs (désactivée en local)
###5️⃣ Lancer le serveur de développement
npm start
Le frontend sera accessible à l’adresse suivante :
👉 http://localhost:3012
