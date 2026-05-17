import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Static imports for the base language (en) — bundled, no flash
import common_en from "./en/common.json";
import nav_en from "./en/nav.json";
import auth_en from "./en/auth.json";
import agents_en from "./en/agents.json";
import adapters_en from "./en/adapters.json";
import issues_en from "./en/issues.json";
import projects_en from "./en/projects.json";
import company_en from "./en/company.json";
import environments_en from "./en/environments.json";
import dashboard_en from "./en/dashboard.json";
import settings_en from "./en/settings.json";
import costs_en from "./en/costs.json";
import secrets_en from "./en/secrets.json";
import errors_en from "./en/errors.json";
import plugins_en from "./en/plugins.json";

// Lazy loader for non-base languages (zh-CN, etc.)
const lazyBackend = {
  type: "backend" as const,
  init: () => {},
  read(language: string, namespace: string, callback: (err: Error | null, data: Record<string, unknown> | null) => void) {
    if (language === "en") {
      return callback(null, null); // en is already in resources
    }
    import(`./${language}/${namespace}.json`)
      .then((mod) => callback(null, mod.default as Record<string, unknown>))
      .catch(() => callback(null, null));
  },
};

const NAMESPACES = [
  "common", "nav", "auth", "agents", "adapters", "issues",
  "projects", "company", "environments", "dashboard",
  "settings", "costs", "secrets", "errors", "plugins",
] as const;

i18n
  .use(lazyBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: common_en,
        nav: nav_en,
        auth: auth_en,
        agents: agents_en,
        adapters: adapters_en,
        issues: issues_en,
        projects: projects_en,
        company: company_en,
        environments: environments_en,
        dashboard: dashboard_en,
        settings: settings_en,
        costs: costs_en,
        secrets: secrets_en,
        errors: errors_en,
        plugins: plugins_en,
      },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "zh-CN"],
    ns: [...NAMESPACES],
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already prevents XSS
    },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "paperclip-lang",
      caches: ["localStorage"],
    },
    // Don't fail on missing keys — show key as fallback
    saveMissing: false,
    missingKeyHandler: undefined,
  });

// Sync document lang attribute
i18n.on("languageChanged", (lng: string) => {
  document.documentElement.setAttribute("lang", lng);
  document.documentElement.dir = "ltr"; // zh-CN and en are both LTR
});

// Set initial lang attribute
document.documentElement.setAttribute("lang", i18n.language);

export default i18n;
