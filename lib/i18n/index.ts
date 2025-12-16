import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next"; // binds i18next to the react-i18next module

import en from "./locales/en.json";
import vi from "./locales/vi.json";

const resources = {
  en: { translation: en },
  vi: { translation: vi },
};

const deviceLanguage = getLocales()[0]?.languageCode ?? "vi";

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage, // get the first language code from the device
  fallbackLng: "vi", // fallback language if the device language is not supported
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
  compatibilityJSON: "v4", // recommended for android
});

export default i18n;
