import test from "node:test";
import assert from "node:assert/strict";
import { SUPPORTED_LANGUAGES, translations } from "../src/lib/i18n/translations.js";

test("i18n: supported languages include all 5 requested languages plus defaults", () => {
  const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
  const names = SUPPORTED_LANGUAGES.map((l) => l.name.toLowerCase());

  assert.ok(codes.includes("en"), "English must be supported");
  assert.ok(codes.includes("hi"), "Hindi must be supported");
  assert.ok(codes.includes("ja"), "Japanese must be supported");
  assert.ok(codes.includes("pt"), "Portuguese must be supported");
  assert.ok(codes.includes("de"), "German must be supported");

  assert.ok(names.includes("hindi"), "Hindi name must be present");
  assert.ok(names.includes("japanese"), "Japanese name must be present");
  assert.ok(names.includes("portuguese"), "Portuguese name must be present");
  assert.ok(names.includes("german"), "German name must be present");
  assert.ok(names.includes("english"), "English name must be present");
});

test("i18n: translations exist for all supported languages with essential sections", () => {
  const requiredSections = [
    "common",
    "nav",
    "footer",
    "settings",
    "dashboard",
    "profile",
    "events",
    "opportunities",
  ];

  for (const lang of ["en", "hi", "ja", "pt", "de", "es", "fr"]) {
    assert.ok(translations[lang], `Translations must exist for language: ${lang}`);
    for (const section of requiredSections) {
      assert.ok(
        translations[lang][section],
        `Section '${section}' must exist for language: ${lang}`
      );
    }
  }
});

test("i18n: Hindi translations correctly translate core navigation and settings", () => {
  const hi = translations.hi;
  assert.equal(hi.nav.events, "इवेंट्स");
  assert.equal(hi.nav.dashboard, "डैशबोर्ड");
  assert.equal(hi.nav.opportunities, "अवसर");
  assert.equal(hi.settings.title, "सेटिंग्स");
  assert.equal(hi.settings.tabs.account, "खाता");
  assert.equal(hi.settings.tabs.preferences, "प्राथमिकताएं");
  assert.equal(hi.settings.language.title, "भाषा");
});

test("i18n: Japanese translations correctly translate core navigation and settings", () => {
  const ja = translations.ja;
  assert.equal(ja.nav.events, "イベント");
  assert.equal(ja.nav.dashboard, "ダッシュボード");
  assert.equal(ja.nav.opportunities, "機会");
  assert.equal(ja.settings.title, "設定");
  assert.equal(ja.settings.tabs.account, "アカウント");
  assert.equal(ja.settings.tabs.preferences, "環境設定");
  assert.equal(ja.settings.language.title, "言語");
});

test("i18n: Portuguese translations correctly translate core navigation and settings", () => {
  const pt = translations.pt;
  assert.equal(pt.nav.events, "Eventos");
  assert.equal(pt.nav.dashboard, "Painel");
  assert.equal(pt.nav.opportunities, "Oportunidades");
  assert.equal(pt.settings.title, "Configurações");
  assert.equal(pt.settings.tabs.account, "Conta");
  assert.equal(pt.settings.tabs.preferences, "Preferências");
  assert.equal(pt.settings.language.title, "Idioma");
});

test("i18n: German translations correctly translate core navigation and settings", () => {
  const de = translations.de;
  assert.equal(de.nav.events, "Veranstaltungen");
  assert.equal(de.nav.dashboard, "Dashboard");
  assert.equal(de.nav.opportunities, "Möglichkeiten");
  assert.equal(de.settings.title, "Einstellungen");
  assert.equal(de.settings.tabs.account, "Konto");
  assert.equal(de.settings.tabs.preferences, "Präferenzen");
  assert.equal(de.settings.language.title, "Sprache");
});
