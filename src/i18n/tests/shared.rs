use aphrody_i18n::*;
use std::collections::BTreeSet;

fn fixtures() -> Vec<serde_json::Value> {
    let raw = include_str!("../../../packages/i18n/tests/fixtures/format.json");
    serde_json::from_str(raw).unwrap()
}

#[test]
fn shared_fixtures_match_typescript() {
    for f in fixtures() {
        let args: Vec<(&str, Arg)> = f["args"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| {
                let a = match v {
                    serde_json::Value::Number(n) => Arg::Num(n.as_f64().unwrap()),
                    other => Arg::Str(other.as_str().unwrap().to_owned()),
                };
                (k.as_str(), a)
            })
            .collect();
        let got =
            I18n::new(f["locale"].as_str().unwrap()).t_args(f["key"].as_str().unwrap(), &args);
        assert_eq!(got, f["out"].as_str().unwrap(), "{f}");
    }
}

#[test]
fn every_locale_has_the_keys_of_en() {
    let all = catalogs();
    let en: BTreeSet<_> = all["en"].keys().collect();
    for l in LOCALES {
        let k: BTreeSet<_> = all[l].keys().collect();
        assert_eq!(en, k, "{l}");
    }
}

#[test]
fn every_message_parses() {
    for (l, c) in catalogs() {
        for (k, v) in c {
            format_message(v, l, &[]).unwrap_or_else(|e| panic!("{l}/{k}: {e}"));
        }
    }
}

#[test]
fn negotiation() {
    assert_eq!(negotiate(Some("fr-CH, fr;q=0.9, en;q=0.8")), "fr");
    assert_eq!(negotiate(Some("zh-Hans-CN,zh;q=0.9")), "zh-CN");
    assert_eq!(negotiate(Some("zh-TW")), "zh-CN");
    assert_eq!(negotiate(Some("de, es;q=0.5")), "es");
    assert_eq!(negotiate(Some("de")), "en");
    assert_eq!(negotiate(Some("*")), "en");
    assert_eq!(negotiate(None), "en");
    assert_eq!(negotiate(Some("es_MX.UTF-8")), "es");
    assert_eq!(
        parse_accept_language("fr;q=0.5, ja, en;q=0.1, de;q=0"),
        ["ja", "fr", "en"]
    );
}

#[test]
fn syntax_errors() {
    for bad in ["{n, plural, one {x}}", "{n", "a } b", "{n, date}"] {
        assert!(format_message(bad, "en", &[]).is_err(), "{bad}");
    }
    assert_eq!(
        format_message("it''s '{'x'}'", "en", &[]).unwrap(),
        "it's {x}"
    );
}
