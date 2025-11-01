# 🧠 ArsMedicaTech — Frontend

Interface utilisateur du projet **ArsMedicaTech**, développée en **React + TypeScript**, permettant d’interagir avec le backend **Flask** et la base de données **SurrealDB**.

---

## ⚙️ Technologies utilisées

| Outil | Description |
|-------|--------------|
| ⚛️ **React + TypeScript** | Interface utilisateur moderne et typée |
| 🌍 **i18next** | Gestion du multilingue (anglais / français) |
| 🧩 **Sentry** | Suivi et capture des erreurs (désactivé en local) |
| 🗄️ **SurrealDB** | Base de données orientée graph |
| 🐍 **Flask** | API backend |
| 🐳 **Docker / Redis** | Services de persistance et cache |

---

## 🚀 Installation et lancement

### **1️⃣ Cloner le projet**

```bash
git clone https://github.com/j4niro/arsmedicatech-frontend.git
cd arsmedicatech-frontend
```

---

### **2️⃣ Installer les dépendances**

```bash
npm install
```

---

### **3️⃣ Ajouter la gestion multilingue (si nécessaire)**

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

---

### **4️⃣ Configurer l’environnement**

Créer un fichier `.env` à la racine du projet avec le contenu suivant :

```ini
API_URL=http://localhost:5000
SENTRY_DSN=http://localhost:5000
```

🧩 **API_URL** : correspond à l’adresse du backend Flask  
🧠 **SENTRY_DSN** : clé de surveillance des erreurs (désactivée en local)

---

### **5️⃣ Lancer le serveur de développement**

```bash
npm start
```

L’application sera disponible à l’adresse suivante :  
👉 [http://localhost:3012](http://localhost:3012)
