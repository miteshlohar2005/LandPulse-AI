"""
LandGuard AI Chatbot API Endpoint

Provides a conversational AI interface for land and property related queries.
Architecturally prepared for LLM API integration (Google Gemini / OpenAI).

Currently uses a rule-based engine; swap in _call_llm() when ready.
"""

import os
import re
import random
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


# ─── Request / Response Models ───────────────────────────────────────────────

class ChatHistoryItem(BaseModel):
    role: str  # 'user' | 'assistant' | 'system'
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatHistoryItem]] = []


class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []


# ─── Knowledge Base ──────────────────────────────────────────────────────────

KNOWLEDGE_PATTERNS: dict[str, dict] = {
    "land_records": {
        "patterns": [
            r"land\s*record", r"bhulekh", r"khasra", r"khatauni",
            r"jamabandi", r"ror", r"record\s+of\s+rights", r"revenue\s+record",
            r"check\s+(my\s+)?(land|property|plot)", r"भूलेख|खसरा|खतौनी"
        ],
        "response": (
            "I can help you understand how to check your land records! 📋\n\n"
            "**General Steps:**\n"
            "1. Visit your state's official land records portal\n"
            "2. Select District → Tehsil → Village\n"
            "3. Search by Khasra Number, Owner Name, or Khata Number\n"
            "4. View and download your ROR/Khatauni\n\n"
            "**Popular State Portals:**\n"
            "• UP — bhulekh.up.nic.in\n"
            "• Rajasthan — apnakhata.raj.nic.in\n"
            "• Bihar — biharbhumi.bihar.gov.in\n"
            "• Jharkhand — jharbhoomi.jharkhand.gov.in\n\n"
            "📌 Please tell me your state for specific guidance!"
        ),
        "suggestions": ["Property Ownership", "Land Survey", "Required Documents"]
    },
    "property_ownership": {
        "patterns": [
            r"owner(ship)?", r"property\s+owner", r"land\s+owner",
            r"transfer", r"sale\s+deed", r"title\s+deed",
            r"मालिक|स्वामित्व|बैनामा"
        ],
        "response": (
            "Here's what you need to know about property ownership: 🏠\n\n"
            "**How to Verify Ownership:**\n"
            "1. Check Revenue Records (Khatauni/ROR)\n"
            "2. Get Encumbrance Certificate from Sub-Registrar\n"
            "3. Examine the chain of ownership through past sale deeds\n"
            "4. Verify property tax receipts\n"
            "5. Physical verification of the property\n\n"
            "**For Ownership Transfer:**\n"
            "• Execute a Sale Deed and register at Sub-Registrar\n"
            "• Pay Stamp Duty and Registration Charges\n"
            "• Apply for Mutation in revenue records\n\n"
            "⚠️ Always verify with the official Sub-Registrar before any transaction."
        ),
        "suggestions": ["Land Records", "Required Documents", "Land Registration"]
    },
    "required_documents": {
        "patterns": [
            r"(required|needed)\s+documents?", r"what\s+documents?",
            r"which\s+documents?", r"documents?\s+(list|for|required|needed)",
            r"दस्तावेज|कागजात"
        ],
        "response": (
            "Here are commonly required documents: 📑\n\n"
            "**For Land Registration:**\n"
            "• Sale Deed\n• ID Proof (Aadhaar, PAN)\n• Property Tax Receipts\n"
            "• Encumbrance Certificate\n• NOC (if applicable)\n• Photos\n\n"
            "**For Mutation:**\n"
            "• Registered Sale Deed\n• Death Certificate (if inherited)\n"
            "• Succession Certificate / Will\n• Existing Khatauni copy\n\n"
            "📌 Requirements vary by state. Please share your state for specifics."
        ),
        "suggestions": ["Land Registration", "Mutation Process", "Property Ownership"]
    },
    "land_disputes": {
        "patterns": [
            r"dispute", r"conflict", r"court", r"litigation",
            r"encroach", r"boundary\s+dispute", r"partition",
            r"विवाद|मुकदमा|अतिक्रमण"
        ],
        "response": (
            "Land disputes can be resolved through these channels: ⚖️\n\n"
            "**Steps to Resolve:**\n"
            "1. Gather all land documents\n"
            "2. File complaint with Tehsildar/SDM\n"
            "3. Try Lok Adalat or mediation\n"
            "4. File civil suit if needed\n"
            "5. Contact District Legal Services Authority for free legal aid\n\n"
            "⚠️ This is general guidance. Please consult a qualified lawyer."
        ),
        "suggestions": ["Required Documents", "Property Ownership", "Land Records"]
    },
    "land_survey": {
        "patterns": [
            r"survey", r"boundary", r"demarcation", r"measurement",
            r"patwari", r"lekhpal", r"amin",
            r"सर्वे|पैमाइश|सीमांकन|नापी"
        ],
        "response": (
            "Here's how land surveys work: 🗺️\n\n"
            "**How to Request:**\n"
            "1. Apply at Tehsil Office\n"
            "2. Pay survey fee\n"
            "3. Patwari/Amin visits the site\n"
            "4. Official measurement and boundary marking\n"
            "5. Receive survey report\n\n"
            "**Documents Needed:**\n"
            "• Application form\n• Khatauni/ROR copy\n"
            "• ID proof\n• Fee receipt\n\n"
            "Timeline: 15-60 days typically."
        ),
        "suggestions": ["Land Records", "Land Disputes", "Required Documents"]
    },
    "application_delay": {
        "patterns": [
            r"delay(ed)?", r"pending", r"status", r"tracking",
            r"how\s+long", r"waiting", r"stuck", r"expedite",
            r"देरी|लंबित|स्टेटस"
        ],
        "response": (
            "If your application is delayed: ⏳\n\n"
            "**What You Can Do:**\n"
            "1. Check online status on your state's portal\n"
            "2. Visit the concerned office with your receipt\n"
            "3. File RTI for status and delay reason\n"
            "4. Use the public grievance portal (pgportal.gov.in)\n"
            "5. Approach District Collector if unresponsive\n\n"
            "**Common Timelines:**\n"
            "• Mutation: 15-30 days\n• Registration: Same day to 7 days\n"
            "• Survey: 15-60 days\n• EC: 7-15 days\n\n"
            "Which application are you tracking?"
        ),
        "suggestions": ["Required Documents", "Land Records", "Land Disputes"]
    },
    "registration": {
        "patterns": [
            r"registr(ation|y|er)", r"sub\s+registrar",
            r"stamp\s+duty", r"register\s+(land|property)",
            r"रजिस्ट्री|पंजीकरण|स्टैंप"
        ],
        "response": (
            "Property Registration Guide: 📝\n\n"
            "**Steps:**\n"
            "1. Verify property documents and title\n"
            "2. Get sale deed drafted by a lawyer\n"
            "3. Calculate and pay stamp duty (4-10% by state)\n"
            "4. Book appointment at Sub-Registrar office\n"
            "5. Both parties appear with 2 witnesses\n"
            "6. Biometric verification\n"
            "7. Submit documents\n"
            "8. Collect registered deed (1-7 days)\n\n"
            "📌 Tell me your state for exact stamp duty rates."
        ),
        "suggestions": ["Required Documents", "Property Ownership", "Mutation"]
    },
    "mutation": {
        "patterns": [
            r"mutation", r"dakhil\s*kharij", r"namantaran",
            r"intkal", r"name\s+(change|transfer)\s+.*record",
            r"दाखिल\s*खारिज|नामांतरण|इंतकाल"
        ],
        "response": (
            "Mutation (Dakhil Kharij) Guide: 📋\n\n"
            "**What is it?** Updating the owner's name in revenue records "
            "after purchase or inheritance.\n\n"
            "**Steps:**\n"
            "1. Get registered deed or succession certificate\n"
            "2. Apply at Tehsil/Circle Office\n"
            "3. Submit required documents\n"
            "4. Patwari verification\n"
            "5. Public notice period (15-30 days)\n"
            "6. Tehsildar approval\n"
            "7. Updated Khatauni issued\n\n"
            "Timeline: 15-45 days | Fee: ₹25-500 (varies by state)"
        ),
        "suggestions": ["Required Documents", "Land Records", "Property Ownership"]
    },
    "fraud": {
        "patterns": [
            r"fraud", r"scam", r"fake", r"forg(e|ery|ed)",
            r"cheat", r"land\s+grab", r"benami",
            r"धोखाधड़ी|फर्जी|जालसाजी|बेनामी"
        ],
        "response": (
            "Land Fraud Prevention Guide: 🛡️\n\n"
            "**Protect Yourself:**\n"
            "1. Verify 30+ years of ownership history\n"
            "2. Get Encumbrance Certificate for 13-30 years\n"
            "3. Physically inspect the property\n"
            "4. Match survey records with Bhu Naksha\n"
            "5. Verify seller's identity documents\n"
            "6. Always get a lawyer to verify documents\n\n"
            "**If Victim:**\n"
            "• File FIR at police station\n"
            "• Report to Cyber Crime Cell (if online)\n"
            "• Approach District Collector\n\n"
            "⚠️ Never pay without thorough verification."
        ),
        "suggestions": ["Property Ownership", "Required Documents", "Land Records"]
    },
    "greeting": {
        "patterns": [
            r"^(hello|hi|hey|greetings|namaste|namaskar)\s*[!.?]?\s*$",
            r"good\s+(morning|afternoon|evening)",
            r"^(नमस्ते|नमस्कार|हेलो|हाय)\s*[!.?]?\s*$"
        ],
        "response": (
            "Hello! 👋 I'm the LandGuard AI Assistant.\n\n"
            "I can help you with land records, property ownership, "
            "registration, mutation, surveys, disputes, and more.\n\n"
            "How can I help you today?"
        ),
        "suggestions": ["Check Land Records", "Property Ownership", "Required Documents"]
    },
    "thanks": {
        "patterns": [
            r"thank(s|\s+you)", r"appreciated", r"helpful",
            r"धन्यवाद|शुक्रिया"
        ],
        "response": (
            "You're welcome! 😊 I'm glad I could help.\n\n"
            "Feel free to ask me anything else about land and property matters."
        ),
        "suggestions": ["Check Land Records", "Property Ownership", "Land Registration"]
    }
}

FALLBACK_RESPONSE = (
    "I appreciate your question! I specialize in land and property matters. "
    "I wasn't able to find a specific answer for that query. 🤔\n\n"
    "I can help with:\n"
    "• Land Records\n• Property Ownership\n• Registration\n"
    "• Mutation\n• Surveys\n• Disputes\n"
    "• Required Documents\n• Application Delays\n• Fraud Prevention\n\n"
    "Could you rephrase your question or pick one of these topics?"
)


# ─── LLM Integration Point ──────────────────────────────────────────────────

async def _call_llm(message: str, conversation_history: List[ChatHistoryItem]) -> Optional[str]:
    """
    Placeholder for LLM API integration.

    To enable:
    1. Set CHATBOT_LLM_API_KEY in your environment
    2. Uncomment and configure the API call below
    3. Supported: Google Gemini, OpenAI, or any compatible API

    Example with Google Gemini:
    ```python
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("CHATBOT_LLM_API_KEY"))
    model = genai.GenerativeModel("gemini-pro")

    system_prompt = (
        "You are LandGuard AI Assistant, specializing in Indian land and property matters. "
        "Provide clear, accurate guidance about land records, ownership, registration, "
        "mutation, surveys, disputes, and related topics. "
        "Respond in the same language as the user's query. "
        "Never fabricate official records, ownership details, or legal rulings."
    )

    history = [{"role": h.role, "parts": [h.content]} for h in conversation_history]
    chat = model.start_chat(history=history)
    response = chat.send_message(message)
    return response.text
    ```
    """
    api_key = os.getenv("CHATBOT_LLM_API_KEY")
    if not api_key:
        return None

    # TODO: Implement LLM call here when API key is available
    return None


# ─── Rule-Based Engine ───────────────────────────────────────────────────────

def _get_rule_response(message: str) -> ChatResponse:
    """Match user message against knowledge patterns and return the best response."""
    normalized = message.lower().strip()

    # Direct database lookup for any project ID (e.g. LA-JH-2026-0042)
    proj_match = re.search(r"\b(LA-[A-Za-z0-9_-]+)\b", message, re.IGNORECASE)
    if proj_match:
        from backend.app.database.session import SessionLocal
        from backend.app.models.entities import Project
        proj_id = proj_match.group(1).upper()
        db = SessionLocal()
        try:
            p = db.query(Project).filter(Project.id == proj_id).first()
            if p:
                pred = p.predictions[0] if p.predictions else None
                risk_cat = pred.risk_category if pred else "LOW"
                delay_prob = round(pred.delay_probability * 100) if pred else 30
                delay_days = pred.predicted_delay_days if pred else 15
                resp = (
                    f"**Project Dossier Telemetry: {p.id}** 🏗️\n\n"
                    f"• **Project Name:** {p.name}\n"
                    f"• **Location:** {p.district}, {p.state}\n"
                    f"• **Sector:** {p.project_type}\n"
                    f"• **Current Stage:** {p.current_stage}\n"
                    f"• **Land Area:** {p.land_area_hectares} Hectares ({p.affected_families} affected families)\n"
                    f"• **Compensation Disbursed:** {p.compensation_percentage}% (₹{p.compensation_disbursed_cr} Cr of ₹{p.compensation_budget_cr} Cr)\n"
                    f"• **AI Risk Level:** **{risk_cat} RISK** (Delay Likelihood: {delay_prob}%, +{delay_days} days expected)\n\n"
                    f"You can view full GIS corridor telemetry for this project in the Map and Projects sections."
                )
                return ChatResponse(
                    response=resp,
                    suggestions=["Application Delay", "Land Records", "Required Documents"]
                )
        except Exception:
            pass
        finally:
            db.close()

    best_match = None
    best_score = 0

    for topic, data in KNOWLEDGE_PATTERNS.items():
        score = 0
        for pattern in data["patterns"]:
            if re.search(pattern, normalized, re.IGNORECASE):
                score += 10
                break

        if score > best_score:
            best_score = score
            best_match = data

    if best_match and best_score > 0:
        return ChatResponse(
            response=best_match["response"],
            suggestions=best_match.get("suggestions", [])
        )

    return ChatResponse(
        response=FALLBACK_RESPONSE,
        suggestions=["Check Land Records", "Property Ownership", "Required Documents"]
    )


# ─── API Endpoint ────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat message and return an AI response.

    The endpoint first tries the LLM API (if configured), then falls back
    to the built-in rule-based engine.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # Try LLM first
        llm_response = await _call_llm(
            request.message,
            request.conversation_history or []
        )

        if llm_response:
            return ChatResponse(
                response=llm_response,
                suggestions=["Land Records", "Property Ownership", "Required Documents"]
            )

        # Fall back to rule-based engine
        return _get_rule_response(request.message)

    except Exception as e:
        # Graceful degradation
        return ChatResponse(
            response=(
                "I apologize, but I'm experiencing a temporary issue. "
                "Please try again in a moment or rephrase your question. 🙏"
            ),
            suggestions=["Check Land Records", "Property Ownership", "Required Documents"]
        )


@router.get("/health")
async def chatbot_health():
    """Health check for the chatbot service."""
    has_llm = bool(os.getenv("CHATBOT_LLM_API_KEY"))
    return {
        "status": "healthy",
        "engine": "llm" if has_llm else "rule-based",
        "supported_languages": ["English", "Hindi"],
        "knowledge_areas": list(KNOWLEDGE_PATTERNS.keys())
    }
