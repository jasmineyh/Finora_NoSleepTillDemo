import { useState, useEffect } from "react";

// Global language singleton
let globalLang = localStorage.getItem("gxbank_lang") || "en";
const listeners = new Set();

export function setGlobalLang(lang) {
  globalLang = lang;
  localStorage.setItem("gxbank_lang", lang);
  listeners.forEach(fn => fn(lang));
}

export function getGlobalLang() {
  return globalLang;
}

export function useLanguage() {
  const [lang, setLang] = useState(globalLang);

  useEffect(() => {
    const handler = (newLang) => setLang(newLang);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return lang;
}