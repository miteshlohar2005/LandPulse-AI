from typing import List, Dict, Any

def explain_project_risk(project_dict: Dict[str, Any], baseline_risk: float = 0.35) -> List[Dict[str, Any]]:
    """
    Computes explainable AI feature attributions for a project.
    Deconstructs why a project is at risk into quantified positive and negative drivers.
    """
    factors = []

    # 1. Compensation Factor
    comp_pct = float(project_dict.get("compensation_percentage", 100))
    if comp_pct < 40:
        impact = round(25.0 + (40 - comp_pct) * 0.25, 1)
        factors.append({
            "factor_name": "Severely Pending Compensation Disbursement",
            "impact_percentage": impact,
            "impact_direction": "positive",
            "category": "Compensation",
            "detail": f"Only {comp_pct:.1f}% compensation disbursed to project affected families (PAFs)."
        })
    elif comp_pct < 70:
        impact = round(14.0 + (70 - comp_pct) * 0.2, 1)
        factors.append({
            "factor_name": "Incomplete Compensation Settlement",
            "impact_percentage": impact,
            "impact_direction": "positive",
            "category": "Compensation",
            "detail": f"{comp_pct:.1f}% compensation disbursed. Unresolved award grievances pending."
        })
    elif comp_pct >= 90:
        factors.append({
            "factor_name": "High Compensation Disbursement Rate",
            "impact_percentage": -8.5,
            "impact_direction": "negative",
            "category": "Compensation",
            "detail": f"{comp_pct:.1f}% compensation disbursed, reducing risk of landowner agitation."
        })

    # 2. Legal Disputes Factor
    disputes = int(project_dict.get("legal_disputes_count", 0))
    if disputes >= 4:
        impact = round(18.0 + min(disputes * 2.5, 12.0), 1)
        factors.append({
            "factor_name": "Multiple Active Legal Title Disputes",
            "impact_percentage": impact,
            "impact_direction": "positive",
            "category": "Legal",
            "detail": f"{disputes} active writ petitions / Section 64 reference cases in courts."
        })
    elif disputes in (1, 2, 3):
        impact = round(10.0 + disputes * 3.0, 1)
        factors.append({
            "factor_name": "Ongoing Court Litigation / Injunctions",
            "impact_percentage": impact,
            "impact_direction": "positive",
            "category": "Legal",
            "detail": f"{disputes} pending court injunctions or valuation disputes."
        })
    else:
        factors.append({
            "factor_name": "Clear Legal Title / Zero Active Injunctions",
            "impact_percentage": -6.0,
            "impact_direction": "negative",
            "category": "Legal",
            "detail": "No pending legal petitions or stay orders recorded."
        })

    # 3. Approval Backlog
    approval_days = int(project_dict.get("approval_delay_days", 0))
    if approval_days > 60:
        impact = round(15.0 + min(approval_days * 0.1, 12.0), 1)
        factors.append({
            "factor_name": "Statutory Approval & Clearance Backlog",
            "impact_percentage": impact,
            "impact_direction": "positive",
            "category": "Approvals",
            "detail": f"Inter-departmental clearance overdue by {approval_days} days."
        })
    elif approval_days > 20:
        impact = round(7.0 + approval_days * 0.15, 1)
        factors.append({
            "factor_name": "Inter-departmental NoC Latency",
            "impact_percentage": impact,
            "impact_direction": "positive",
            "category": "Approvals",
            "detail": f"Approvals delayed by {approval_days} days beyond statutory timeline."
        })
    else:
        factors.append({
            "factor_name": "Timely Inter-Agency Clearances",
            "impact_percentage": -4.5,
            "impact_direction": "negative",
            "category": "Approvals",
            "detail": "Approvals progressing within mandated charter limits."
        })

    # 4. Documentation Completeness
    doc_complete = bool(project_dict.get("documentation_complete", False))
    if not doc_complete:
        factors.append({
            "factor_name": "Incomplete Land Cadastre & Title Records",
            "impact_percentage": 11.5,
            "impact_direction": "positive",
            "category": "Documentation",
            "detail": "Missing RoR (Record of Rights), land survey maps or award sheets."
        })
    else:
        factors.append({
            "factor_name": "Verified Cadastral & Ownership Records",
            "impact_percentage": -5.0,
            "impact_direction": "negative",
            "category": "Documentation",
            "detail": "Digitized land records and revenue gazettes fully verified."
        })

    # 5. Stakeholder Responsiveness
    stakeholder = str(project_dict.get("stakeholder_responsiveness", "Medium")).capitalize()
    if stakeholder == "Low":
        factors.append({
            "factor_name": "Low Stakeholder Engagement & Public Resistance",
            "impact_percentage": 12.0,
            "impact_direction": "positive",
            "category": "Stakeholder",
            "detail": "Resistance during Gram Sabha hearings or sluggish administrative response."
        })
    elif stakeholder == "High":
        factors.append({
            "factor_name": "Proactive Stakeholder & Community Alignment",
            "impact_percentage": -7.5,
            "impact_direction": "negative",
            "category": "Stakeholder",
            "detail": "Constructive Gram Sabha consensus and rapid district coordination."
        })

    # 6. Historical District Delay Tendency
    hist_score = float(project_dict.get("historical_district_delay_score", 5.0))
    if hist_score >= 7.0:
        impact = round((hist_score - 5.0) * 3.5, 1)
        factors.append({
            "factor_name": "District Administrative Acquisition Bottleneck",
            "impact_percentage": impact,
            "impact_direction": "positive",
            "category": "Geographic",
            "detail": f"District historical acquisition backlog index is high ({hist_score}/10)."
        })
    elif hist_score <= 3.5:
        factors.append({
            "factor_name": "Efficient District Revenue Administration",
            "impact_percentage": -4.0,
            "impact_direction": "negative",
            "category": "Geographic",
            "detail": f"District maintains strong execution velocity ({hist_score}/10)."
        })

    # 7. Scale / Human Impact (Affected Families vs Area)
    families = int(project_dict.get("affected_families", 0))
    area = float(project_dict.get("land_area_hectares", 1))
    density = families / max(area, 1.0)
    if density > 4.0 and families > 200:
        factors.append({
            "factor_name": "Dense Population Displacement (R&R Complexity)",
            "impact_percentage": 9.5,
            "impact_direction": "positive",
            "category": "Rehabilitation",
            "detail": f"{families} project affected families in {area:.1f} ha creates high R&R relocation overhead."
        })

    # Sort so largest contributors appear first
    factors.sort(key=lambda f: abs(f["impact_percentage"]), reverse=True)
    return factors
