//! Localisation : chaînes Fluent embarquées, langue détectée depuis le système.

use std::borrow::Cow;
use std::collections::HashMap;

use fluent_templates::fluent_bundle::FluentValue;
use fluent_templates::{Loader, static_loader};
pub use unic_langid::LanguageIdentifier;

static_loader! {
    static LOCALES = {
        locales: "./locales",
        fallback_language: "en-US",
        customise: |bundle| bundle.set_use_isolating(false),
    };
}

/// Langues livrées, dans l'ordre d'affichage.
pub const LANGUAGES: [&str; 16] = [
    "en-US", "fr-FR", "es-ES", "de-DE", "it-IT", "pt-BR", "nl-NL", "pl-PL", "ru-RU", "uk-UA",
    "tr-TR", "ar", "hi-IN", "zh-CN", "ja-JP", "ko-KR",
];

/// Langues écrites de droite à gauche.
const RTL: [&str; 6] = ["ar", "he", "fa", "ur", "ps", "yi"];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Direction {
    Ltr,
    Rtl,
}

/// Traducteur lié à une langue.
#[derive(Debug, Clone)]
pub struct I18n {
    lang: LanguageIdentifier,
}

impl I18n {
    /// Langue demandée, sinon la plus proche livrée (même langue, autre région), sinon en-US.
    pub fn new(requested: &str) -> Self {
        let lang = negotiate(requested)
            .parse()
            .expect("identifiant de langue livré valide");
        Self { lang }
    }

    /// Langue du système (`LANG`, paramètres régionaux Windows/macOS).
    pub fn from_system() -> Self {
        Self::new(
            &std::env::var("TV_LANG")
                .ok()
                .or_else(sys_locale::get_locale)
                .unwrap_or_default(),
        )
    }

    pub fn lang(&self) -> &LanguageIdentifier {
        &self.lang
    }

    pub fn direction(&self) -> Direction {
        if RTL.contains(&self.lang.language.as_str()) {
            Direction::Rtl
        } else {
            Direction::Ltr
        }
    }

    pub fn t(&self, key: &str) -> String {
        LOCALES.lookup(&self.lang, key)
    }

    pub fn t_args(&self, key: &str, args: &[(&'static str, FluentValue<'_>)]) -> String {
        let map: HashMap<Cow<'static, str>, FluentValue<'_>> = args
            .iter()
            .map(|(k, v)| (Cow::Borrowed(*k), v.clone()))
            .collect();
        LOCALES.lookup_with_args(&self.lang, key, &map)
    }
}

fn negotiate(requested: &str) -> &'static str {
    let req = requested.replace('_', "-");
    let req = req.split(['.', '@']).next().unwrap_or_default();
    let base = req
        .split('-')
        .next()
        .unwrap_or_default()
        .to_ascii_lowercase();
    LANGUAGES
        .iter()
        .find(|l| l.eq_ignore_ascii_case(req))
        .or_else(|| {
            LANGUAGES
                .iter()
                .find(|l| l.split('-').next().unwrap().eq_ignore_ascii_case(&base))
        })
        .copied()
        .unwrap_or("en-US")
}

pub use fluent_templates::fluent_bundle::FluentValue as Value;

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeSet;

    fn keys(lang: &str) -> BTreeSet<String> {
        let path = format!("{}/locales/{lang}/main.ftl", env!("CARGO_MANIFEST_DIR"));
        std::fs::read_to_string(&path)
            .unwrap_or_else(|_| panic!("{path} manquant"))
            .lines()
            .filter_map(|l| l.split_once(" =").map(|(k, _)| k.trim().to_owned()))
            .filter(|k| !k.is_empty() && !k.starts_with(['#', ' ', '.', '*', '[']))
            .collect()
    }

    #[test]
    fn toutes_les_langues_sont_completes() {
        let reference = keys("en-US");
        assert!(reference.len() >= 20);
        for lang in LANGUAGES {
            let k = keys(lang);
            let manque: Vec<_> = reference.difference(&k).collect();
            assert!(manque.is_empty(), "{lang} : clés manquantes {manque:?}");
        }
    }

    #[test]
    fn negociation() {
        assert_eq!(I18n::new("fr_CA.UTF-8").lang().to_string(), "fr-FR");
        assert_eq!(I18n::new("pt-PT").lang().to_string(), "pt-BR");
        assert_eq!(I18n::new("ar-MA").direction(), Direction::Rtl);
        assert_eq!(I18n::new("xx").lang().to_string(), "en-US");
    }

    #[test]
    fn pluriels_cldr() {
        let n =
            |lang: &str, v: i64| I18n::new(lang).t_args("streams-count", &[("count", v.into())]);
        assert_eq!(n("en-US", 1), "1 stream");
        assert_eq!(n("en-US", 3), "3 streams");
        assert_eq!(n("fr-FR", 1), "1 flux");
        assert_eq!(n("ru-RU", 2), "2 потока");
        assert_eq!(n("ru-RU", 5), "5 потоков");
        assert_eq!(n("pl-PL", 22), "22 strumienie");
        assert_eq!(n("ar", 2), "دفقان");
    }

    #[test]
    fn aucune_cle_vide_ni_non_traduite() {
        for lang in LANGUAGES {
            let i = I18n::new(lang);
            for k in keys("en-US") {
                let v = i.t_args(&k, &[("count", 2.into())]);
                assert!(
                    !v.is_empty() && !v.contains("Unknown localization"),
                    "{lang}/{k}"
                );
            }
        }
    }
}
