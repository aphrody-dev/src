use crate::models::AuditReport;
use crate::rules::RULES;

pub fn format_human_report(report: &AuditReport) -> String {
    let mut out = String::new();
    out.push_str("==============================================================================\n");
    out.push_str(&format!(
        "ARCHGUARD v{} — Sovereign Monorepo Architecture & Domain-Purity Gate\n",
        report.version
    ));
    out.push_str("==============================================================================\n");
    out.push_str(&format!("Root:           {}\n", report.root));
    out.push_str(&format!("Scanned Files:  {}\n", report.scanned_files));
    out.push_str(&format!("Duration:       {:.2} ms\n", report.duration_ms));
    out.push_str(&format!("Report Blake3:  {}\n", &report.report_blake3[..16]));
    out.push_str(&format!(
        "Status:         {} ({} errors, {} warnings)\n",
        if report.clean { "PASS" } else { "FAIL" },
        report.error_count,
        report.warning_count
    ));
    out.push_str("------------------------------------------------------------------------------\n");
    out.push_str("Rule Breakdown:\n");
    for rule in RULES {
        let count = report.by_rule.get(rule.id).copied().unwrap_or(0);
        let status = if count == 0 { "OK" } else { "VIOLATION" };
        out.push_str(&format!(
            "  {:<10} {:<10} {:>4}  {}\n",
            rule.id, status, count, rule.category
        ));
    }

    if !report.findings.is_empty() {
        out.push_str(
            "------------------------------------------------------------------------------\n",
        );
        out.push_str("Findings:\n");
        for (idx, f) in report.findings.iter().enumerate() {
            let loc = match f.line {
                Some(ln) => format!("{}:{}", f.path, ln),
                None => f.path.clone(),
            };
            out.push_str(&format!(
                "  {}. [{}] {} ({})\n     Message:     {}\n     Remediation: {}\n",
                idx + 1,
                f.severity.as_str(),
                f.rule_id,
                loc,
                f.message,
                f.remediation
            ));
        }
    }
    out.push_str("==============================================================================\n");
    out
}
