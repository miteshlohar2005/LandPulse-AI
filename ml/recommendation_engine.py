from typing import List, Dict, Any

def generate_recommendations(project_dict: Dict[str, Any], risk_category: str = "HIGH") -> List[Dict[str, Any]]:
    """
    Generates structured, actionable recommendations mapped directly to detected bottlenecks
    under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation
    and Resettlement (RFCTLARR) Act, 2013 and DoLR guidelines.
    """
    recommendations = []

    comp_pct = float(project_dict.get("compensation_percentage", 100))
    disputes = int(project_dict.get("legal_disputes_count", 0))
    approval_days = int(project_dict.get("approval_delay_days", 0))
    doc_complete = bool(project_dict.get("documentation_complete", False))
    stakeholder = str(project_dict.get("stakeholder_responsiveness", "Medium")).capitalize()
    rehab_pct = float(project_dict.get("rehabilitation_percentage", 100))
    current_stage = str(project_dict.get("current_stage", ""))
    possession_pct = float(project_dict.get("possession_percentage", project_dict.get("land_acquisition_progress", 100)))
    comp_delay = int(project_dict.get("compensation_delay_days", 0))
    doc_pct = float(project_dict.get("document_completion_percentage", 100 if doc_complete else 50))

    # Rule 1: IF land acquisition < 60% → Prioritize acquisition review
    if possession_pct < 60:
        recommendations.append({
            "problem": f"Land Acquisition Progress Low ({possession_pct:.1f}% < 60%)",
            "severity": "CRITICAL" if possession_pct < 40 else "HIGH",
            "recommended_action": "Prioritize land acquisition review; initiate expedited Section 38 joint demarcation survey with District Revenue Authority.",
            "responsible_department": "District Collectorate & CALA",
            "priority": "P1",
            "expected_impact": "Accelerates ground handover progress by 25 to 35 days."
        })

    # Rule 2: IF compensation delay > 30 days → Escalate compensation processing
    if comp_delay > 30 or comp_pct < 75:
        recommendations.append({
            "problem": f"Compensation Disbursement Delayed ({comp_delay} days > 30 days)",
            "severity": "CRITICAL" if comp_delay > 60 or comp_pct < 40 else "HIGH",
            "recommended_action": "Escalate compensation processing; convene Special LAO Lok Adalat for direct bank transfer (DBT) verification and award release.",
            "responsible_department": "Revenue & Land Reforms Department / Special LAO",
            "priority": "P1",
            "expected_impact": "Unlocks pending award payments, avoiding landowner agitation."
        })

    # Rule 3: IF legal cases >= 5 → Assign legal review priority
    if disputes >= 5:
        recommendations.append({
            "problem": f"High Litigation Volume ({disputes} Active Legal Cases >= 5 Threshold)",
            "severity": "CRITICAL",
            "recommended_action": "Assign legal review priority; file urgent hearing applications in High Court and refer valuation disputes to State LARR Authority (Sec 64).",
            "responsible_department": "State Legal Cell & Standing Government Counsel",
            "priority": "P1",
            "expected_impact": "Mitigates interim stay orders and saves up to 60 days of court litigation latency."
        })
    elif disputes >= 1:
        recommendations.append({
            "problem": f"{disputes} Pending Court Grievance(s)",
            "severity": "HIGH",
            "recommended_action": "Engage standing government counsel to file counter-affidavits and propose deposit of compensation in escrow to lift interim stays.",
            "responsible_department": "District Legal Officer",
            "priority": "P2",
            "expected_impact": "Facilitates early disposal of status-quo orders within 15-30 days."
        })

    # Rule 4: IF document completion < 80% → Identify and complete missing documents
    if doc_pct < 80 or not doc_complete:
        recommendations.append({
            "problem": f"Incomplete Cadastre & Title Documentation ({doc_pct:.1f}% < 80%)",
            "severity": "HIGH",
            "recommended_action": "Identify and complete missing documents; deploy Patwari task-force using DILRMP digitized maps to verify RoR.",
            "responsible_department": "District Settlement & Revenue Department",
            "priority": "P2",
            "expected_impact": "Eliminates title ambiguities and Gazette notification deficiencies in 14 days."
        })

    # 5. Approvals Backlog
    if approval_days > 45:
        recommendations.append({
            "problem": f"Statutory Clearances Overdue by {approval_days} Days",
            "severity": "HIGH",
            "recommended_action": "Escalate inter-departmental pending NoCs to State Level Single Window / PMG Portal for Chief Secretary review.",
            "responsible_department": "Project Monitoring Group (PMG) & Line Ministry",
            "priority": "P1",
            "expected_impact": "Bypasses inter-agency friction and recovers 20-30 days in timeline."
        })
    elif approval_days > 15:
        recommendations.append({
            "problem": f"Pending Inter-Departmental Clearances ({approval_days} days)",
            "severity": "MEDIUM",
            "recommended_action": "Schedule bilateral coordination session with Forest, Railway, or Defense authorities for expedited Joint Site Inspection.",
            "responsible_department": "Executing Agency / Nodal Officer",
            "priority": "P2",
            "expected_impact": "Expedites pending NoCs within 10-14 days."
        })


    # 5. Stakeholder Responsiveness
    if stakeholder == "Low":
        recommendations.append({
            "problem": "Low Stakeholder Responsiveness & Community Resistance",
            "severity": "HIGH",
            "recommended_action": "Convene Special Gram Sabha consultations with PRI leaders and civil society mediators; transparently present the R&R benefit matrix.",
            "responsible_department": "Sub-Divisional Magistrate (SDM) & Social Impact Assessment (SIA) Unit",
            "priority": "P1",
            "expected_impact": "Restores community trust, preventing local blockades and saving 25-40 days."
        })

    # 6. R&R Progress
    if rehab_pct < 50 and current_stage in ["Rehabilitation & Resettlement", "Possession", "Compensation Disbursement"]:
        recommendations.append({
            "problem": f"Lagging Rehabilitation & Resettlement Infrastructure ({rehab_pct:.1f}%)",
            "severity": "HIGH",
            "recommended_action": "Fast-track basic civic amenities (water, roads, school) at R&R resettlement colony and disburse one-time transitional allowances.",
            "responsible_department": "R&R Commissioner / District Administration",
            "priority": "P2",
            "expected_impact": "Unlocks voluntary physical relocation, advancing possession by 30 days."
        })

    # 7. Possession Bottleneck
    if possession_pct < 40 and current_stage in ["Possession", "Final Acquisition"]:
        recommendations.append({
            "problem": f"Physical Land Possession Lagging ({possession_pct:.1f}%)",
            "severity": "CRITICAL",
            "recommended_action": "Coordinate joint demarcation survey with district police bandobast and issue Sec 38 possession certificates in peaceful clusters.",
            "responsible_department": "District Magistrate & Superintendent of Police",
            "priority": "P1",
            "expected_impact": "Enables phased handover to contractor, mitigating civil work standby penalties."
        })

    # Fallback if everything is on track
    if not recommendations:
        recommendations.append({
            "problem": "No Critical Bottlenecks Detected",
            "severity": "LOW",
            "recommended_action": "Maintain scheduled milestone tracking and ensure timely upload of monthly physical-financial progress reports.",
            "responsible_department": "Project Monitoring Unit",
            "priority": "P3",
            "expected_impact": "Maintains current project velocity on target."
        })

    return recommendations
