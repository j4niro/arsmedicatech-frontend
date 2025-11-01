import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en.json";
import fr from "./fr.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en.common },
      fr: { common: fr.common }
    },
    ns: ["common"],
    defaultNS: "common",
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
