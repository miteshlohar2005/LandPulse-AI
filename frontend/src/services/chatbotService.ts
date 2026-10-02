/**
 * LandGuard AI Chatbot Service
 * 
 * Provides AI-powered responses for land and property related questions.
 * Works in two modes:
 *   1. Offline/Demo: Built-in rule-based NLP engine (default)
 *   2. LLM API: Routes to backend when VITE_CHATBOT_API_URL is configured
 */

// ─── Types ──────────────────────────────────────────────────────────────────
import { DEMO_PROJECTS } from '../data/demoData';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  suggestions?: string[];
}

interface KnowledgeEntry {
  keywords: string[];          // English + Hindi keywords
  patterns: RegExp[];          // Regex patterns for flexible matching
  responses: string[];         // Multiple response variants
  followUp?: string;           // Optional follow-up question
  suggestions?: string[];      // Related quick actions
}

// ─── Knowledge Base ─────────────────────────────────────────────────────────

const KNOWLEDGE_BASE: Record<string, KnowledgeEntry> = {
  land_records: {
    keywords: [
      'land record', 'land records', 'bhulekh', 'bhu naksha', 'khasra', 'khatauni',
      'jamabandi', 'ror', 'record of rights', 'revenue record', 'bhumi',
      'check land', 'verify land', 'land details', 'plot details',
      'जमीन रिकॉर्ड', 'भूलेख', 'खसरा', 'खतौनी', 'जमाबंदी', 'भू नक्शा',
      'जमीन का रिकॉर्ड', 'भूमि रिकॉर्ड'
    ],
    patterns: [
      /how\s+(can|do|to)\s+(i\s+)?(check|view|see|get|find|access)\s+.*(land|property|plot)\s*(record|detail)/i,
      /land\s*record/i,
      /check\s+my\s+(land|property|plot)/i,
      /भूलेख|खसरा|खतौनी|जमाबंदी/i
    ],
    responses: [
      `I can help you understand how to check your land records! 📋\n\nHere's a general guide:\n\n**Step 1:** Visit your state's official land records portal (e.g., Bhulekh for UP, Dharitree for Assam, Bhoomi for Karnataka)\n\n**Step 2:** Select your District, Tehsil/Taluka, and Village\n\n**Step 3:** Search using one of these:\n• Khasra/Survey Number\n• Owner's Name (Khatedar)\n• Khata Number\n\n**Step 4:** View and download your land record (ROR/Khatauni)\n\n**Popular State Portals:**\n• UP — bhulekh.up.nic.in\n• Rajasthan — apnakhata.raj.nic.in\n• Bihar — biharbhumi.bihar.gov.in\n• Jharkhand — jharbhoomi.jharkhand.gov.in\n• MP — mpbhulekh.gov.in\n\n📌 Please tell me your state for specific guidance!`,
      `To check your land records, you'll need to visit your state's online land records portal. 🏛️\n\nMost states have digitized their land records. You can search by:\n• **Khasra Number** (plot number)\n• **Owner/Khatedar Name**\n• **Khata/Account Number**\n\nWould you like me to guide you for a specific state? Just share your state name.`
    ],
    followUp: 'Which state are you looking for land records in?',
    suggestions: ['Property Ownership', 'Land Survey', 'Required Documents']
  },

  property_ownership: {
    keywords: [
      'ownership', 'owner', 'property owner', 'land owner', 'transfer',
      'property transfer', 'ownership transfer', 'sale deed', 'conveyance',
      'title deed', 'title', 'freehold', 'leasehold', 'joint ownership',
      'मालिक', 'मालिकाना', 'स्वामित्व', 'जमीन का मालिक', 'बैनामा',
      'रजिस्ट्री', 'हस्तांतरण', 'संपत्ति हस्तांतरण'
    ],
    patterns: [
      /who\s+(is|owns|are)\s+.*(owner|owns)/i,
      /property\s*owner/i,
      /ownership\s*(transfer|verify|check|proof|document)/i,
      /transfer\s*(of\s+)?(property|land|ownership)/i,
      /मालिक|स्वामित्व|बैनामा/i
    ],
    responses: [
      `Here's what you need to know about property ownership verification: 🏠\n\n**How to Verify Ownership:**\n\n1. **Check Revenue Records** — Verify the Khatauni/ROR to see the recorded owner\n2. **Encumbrance Certificate (EC)** — Get this from the Sub-Registrar's office to check for liens, mortgages, or disputes\n3. **Title Search** — Examine the chain of ownership through past sale deeds\n4. **Property Tax Receipts** — Verify who has been paying municipal taxes\n5. **Physical Verification** — Visit the property to check actual possession\n\n**For Ownership Transfer (Sale):**\n• Execute a Sale Deed and register it at the Sub-Registrar's office\n• Pay applicable Stamp Duty and Registration Charges\n• Apply for Mutation (name change in revenue records)\n\n⚠️ *Always verify documents with the official Sub-Registrar and Revenue Department before any transaction.*`,
      `Property ownership can be verified through several official channels: 🔍\n\n• **Revenue Records (Khatauni/ROR)** — Shows the current recorded owner\n• **Encumbrance Certificate** — Confirms no pending loans or disputes\n• **Registered Sale Deed** — Legal proof of purchase\n• **Property Tax Receipts** — Indicates the taxpaying owner\n\nWould you like to know more about ownership transfer or verification for a specific state?`
    ],
    followUp: 'Are you looking to verify existing ownership or transfer property?',
    suggestions: ['Land Records', 'Required Documents', 'Land Registration']
  },

  required_documents: {
    keywords: [
      'document', 'documents', 'required documents', 'papers', 'paperwork',
      'what documents', 'which documents', 'documentation', 'documents needed',
      'documents required', 'documents list', 'checklist',
      'दस्तावेज', 'कागजात', 'जरूरी कागजात', 'दस्तावेज सूची',
      'जरूरी दस्तावेज', 'कौन से कागजात'
    ],
    patterns: [
      /what\s+(documents?|papers?|paperwork)\s+(are|is|do|will)\s+(required|needed|necessary)/i,
      /documents?\s+(required|needed|for|list)/i,
      /which\s+(documents?|papers?)/i,
      /required\s+documents?/i,
      /दस्तावेज|कागजात/i
    ],
    responses: [
      `Here are the commonly required documents for various land-related processes: 📑\n\n**For Land Registration / Sale:**\n• Sale Deed (drafted by a lawyer)\n• Identity Proof (Aadhaar, PAN, Voter ID)\n• Property Tax Receipts\n• Encumbrance Certificate\n• NOC (if applicable)\n• Passport-size Photos\n• Previous Title Deeds / Chain Documents\n\n**For Mutation / Name Transfer:**\n• Registered Sale Deed\n• Death Certificate (if inherited)\n• Succession Certificate / Will (if applicable)\n• Identity Proof of the applicant\n• Copy of existing Khatauni/ROR\n• Application form (prescribed by the state)\n\n**For Land Survey / Demarcation:**\n• Application to the Tehsil office\n• Copy of Khatauni/ROR\n• Identity Proof\n• Fee Receipt\n\n📌 Document requirements vary by state. Please share your state for specific requirements.`,
      `The documents required depend on the specific process you're undertaking. Here's a quick overview: 📄\n\n• **Registration**: Sale Deed, ID proof, tax receipts, EC, NOC\n• **Mutation**: Sale deed, death certificate (if inherited), Khatauni copy\n• **Loan/Mortgage**: Title deed, EC, valuation report, ID/address proof\n\nWhich specific process do you need documents for?`
    ],
    followUp: 'Which process do you need the document list for — registration, mutation, or something else?',
    suggestions: ['Land Registration', 'Mutation Process', 'Property Ownership']
  },

  land_disputes: {
    keywords: [
      'dispute', 'disputes', 'land dispute', 'property dispute', 'conflict',
      'legal', 'court', 'case', 'litigation', 'encroachment', 'trespass',
      'boundary dispute', 'partition', 'family dispute', 'inheritance dispute',
      'विवाद', 'कोर्ट', 'मुकदमा', 'भूमि विवाद', 'ज़मीन विवाद',
      'अतिक्रमण', 'कब्ज़ा', 'बंटवारा'
    ],
    patterns: [
      /land\s*dispute/i,
      /property\s*dispute/i,
      /dispute\s*(resolution|settle|resolve|handle|about)/i,
      /someone\s+(encroach|occupy|took|grab|seized)/i,
      /boundary\s*(dispute|issue|problem|conflict)/i,
      /विवाद|मुकदमा|अतिक्रमण/i
    ],
    responses: [
      `Land disputes can be complex but there are structured ways to address them: ⚖️\n\n**Types of Land Disputes:**\n• Boundary disputes between neighbors\n• Title/ownership disputes\n• Inheritance and partition disputes\n• Encroachment by third parties\n• Government acquisition disputes\n\n**Steps to Resolve:**\n\n1. **Gather Documents** — Collect all land records, sale deeds, tax receipts, and survey records\n2. **Revenue Court** — File a complaint with the Tehsildar/SDM for revenue-related disputes\n3. **Mediation** — Try Lok Adalat or mediation centers for faster, low-cost resolution\n4. **Civil Court** — File a civil suit if mediation fails\n5. **Legal Aid** — Contact the District Legal Services Authority for free legal help\n\n**Important Contacts:**\n• Tehsildar/Naib-Tehsildar (Revenue matters)\n• District Collector (Government land matters)\n• District Legal Services Authority (Free legal aid)\n\n⚠️ *This is general guidance. For specific legal advice, please consult a qualified lawyer or your local legal services authority.*`,
      `Dealing with a land dispute? Here are your options: ⚖️\n\n1. **Document Everything** — Gather Khatauni, sale deeds, tax receipts\n2. **Revenue Court** — Approach the Tehsildar for revenue disputes\n3. **Lok Adalat** — Faster alternative dispute resolution\n4. **Civil Court** — For ownership/title disputes\n5. **Legal Aid** — Free help from District Legal Services Authority\n\nWhat type of dispute are you facing?`
    ],
    followUp: 'What type of land dispute are you dealing with? (boundary, ownership, inheritance, encroachment, etc.)',
    suggestions: ['Required Documents', 'Property Ownership', 'Land Records']
  },

  land_survey: {
    keywords: [
      'survey', 'land survey', 'boundary', 'demarcation', 'measurement',
      'survey number', 'area measurement', 'plot measurement', 'tehsil',
      'patwari', 'lekhpal', 'amin', 'surveyor',
      'सर्वे', 'पैमाइश', 'सीमांकन', 'नापी', 'पटवारी', 'लेखपाल', 'अमीन'
    ],
    patterns: [
      /land\s*survey/i,
      /survey\s*(number|no|request|apply|process|report)/i,
      /(boundary|plot|area)\s*(survey|measurement|demarcation)/i,
      /how\s+to\s+(get|request|apply)\s+.*survey/i,
      /सर्वे|पैमाइश|सीमांकन|नापी/i
    ],
    responses: [
      `Here's how land surveys and boundary demarcation work: 🗺️\n\n**What is a Land Survey?**\nA land survey is the official measurement and mapping of a land parcel to establish its boundaries, area, and location.\n\n**How to Request a Survey:**\n\n1. **Apply at Tehsil Office** — Submit an application to the Tehsildar\n2. **Pay Survey Fee** — Fees vary by state and area\n3. **Patwari/Lekhpal/Amin Visit** — The designated survey officer visits the site\n4. **Measurement & Demarcation** — Official boundary markers are placed\n5. **Survey Report** — You receive the official measurement report\n\n**When to Get a Survey Done:**\n• Before buying/selling property\n• Boundary disputes with neighbors\n• Before construction\n• Partition of joint land\n• Government acquisition proceedings\n\n**Documents Needed:**\n• Application form\n• Copy of Khatauni/ROR\n• Identity proof\n• Fee payment receipt\n\n📌 Survey timelines vary by state — typically 15-60 days after application.`,
    ],
    followUp: 'Would you like to know the survey process for a specific state?',
    suggestions: ['Land Records', 'Land Disputes', 'Required Documents']
  },

  application_delay: {
    keywords: [
      'delay', 'delayed', 'pending', 'status', 'tracking', 'track',
      'application status', 'how long', 'time taken', 'waiting',
      'not processed', 'slow', 'stuck', 'follow up', 'expedite',
      'देरी', 'लंबित', 'स्टेटस', 'ट्रैकिंग', 'कब तक', 'कितने दिन',
      'आवेदन स्थिति'
    ],
    patterns: [
      /application\s*(delay|status|pending|stuck|tracking)/i,
      /delay\s*(in\s+)?(application|process|mutation|registration)/i,
      /how\s+(long|much\s+time)\s+(does|will|would)/i,
      /(pending|stuck|delayed)\s+(application|case|request|mutation)/i,
      /track\s*(my|the)?\s*(application|case|request)/i,
      /देरी|लंबित|स्टेटस/i
    ],
    responses: [
      `If your land-related application is delayed, here's what you can do: ⏳\n\n**Common Timelines:**\n• Mutation: 15-30 days (varies by state)\n• Land Registration: Same day to 7 days\n• Land Survey: 15-60 days\n• Encumbrance Certificate: 7-15 days\n• Name Transfer: 30-90 days\n\n**If Delayed Beyond Expected Time:**\n\n1. **Check Online Status** — Use your state's online portal with your application/reference number\n2. **Visit the Office** — Go to the concerned Tehsil/Sub-Registrar office with your receipt\n3. **File RTI** — Submit an RTI application asking for the status and reason for delay\n4. **Grievance Portal** — File a complaint on the state's public grievance portal (e.g., CPGRAMS at pgportal.gov.in)\n5. **Higher Authority** — Approach the District Collector or ADM if local officials are unresponsive\n\n**Tips:**\n• Always keep your application receipt and reference number\n• Note the name and designation of officials you speak with\n• Follow up in writing (not just verbally)\n\n📌 Which application are you tracking? I can provide more specific guidance.`,
    ],
    followUp: 'What type of application is delayed? (Mutation, Registration, Survey, etc.)',
    suggestions: ['Required Documents', 'Land Records', 'Land Disputes']
  },

  land_registration: {
    keywords: [
      'registration', 'register', 'registry', 'sub registrar', 'stamp duty',
      'registration fee', 'registration process', 'property registration',
      'sale deed registration', 'deed registration',
      'रजिस्ट्री', 'पंजीकरण', 'स्टैंप ड्यूटी', 'रजिस्ट्रेशन',
      'सब रजिस्ट्रार'
    ],
    patterns: [
      /land\s*registration/i,
      /property\s*registration/i,
      /how\s+to\s+register\s+(land|property|plot)/i,
      /registration\s*(process|fee|charge|cost|step)/i,
      /stamp\s*duty/i,
      /रजिस्ट्री|पंजीकरण|रजिस्ट्रेशन/i
    ],
    responses: [
      `Here's a comprehensive guide to land/property registration: 📝\n\n**Steps for Property Registration:**\n\n1. **Verify Property** — Check land records, title, and encumbrance certificate\n2. **Draft Sale Deed** — Get a lawyer to draft the sale agreement\n3. **Calculate Stamp Duty** — Based on the property value or circle rate (whichever is higher)\n4. **Pay Stamp Duty & Registration Fee** — Online or at the treasury\n5. **Book Appointment** — Schedule a visit to the Sub-Registrar's office (many states allow online booking)\n6. **Visit Sub-Registrar** — Both buyer and seller appear with 2 witnesses\n7. **Biometric Verification** — Aadhaar-based identity verification\n8. **Document Submission** — Submit all documents for registration\n9. **Collect Registered Deed** — Typically available in 1-7 days\n\n**Documents Needed:**\n• Sale Deed (on stamp paper)\n• ID proof of buyer, seller, and witnesses\n• PAN cards of buyer and seller\n• Previous title deeds\n• Encumbrance Certificate\n• Property tax receipts\n• Passport-size photographs\n• NOC (if applicable)\n\n**Stamp Duty Rates** vary from 4-10% depending on the state.\n\n📌 Tell me your state for exact stamp duty rates and portal links.`,
    ],
    followUp: 'Which state do you want to register property in?',
    suggestions: ['Required Documents', 'Property Ownership', 'Stamp Duty']
  },

  mutation: {
    keywords: [
      'mutation', 'dakhil kharij', 'name change', 'name transfer',
      'intkal', 'fard', 'mutation process', 'mutation application',
      'दाखिल खारिज', 'नामांतरण', 'इंतकाल', 'नाम बदलना',
      'नाम ट्रांसफर'
    ],
    patterns: [
      /mutation/i,
      /dakhil\s*kharij/i,
      /name\s*(change|transfer)\s*(in\s+)?(land|property|revenue|record)/i,
      /intkal|fard/i,
      /दाखिल खारिज|नामांतरण|इंतकाल/i
    ],
    responses: [
      `Mutation (Dakhil Kharij / Namantaran) is the process of updating the owner's name in revenue records: 📋\n\n**What is Mutation?**\nAfter buying land or inheriting property, the revenue records must be updated to reflect the new owner's name. This is called Mutation.\n\n**How to Apply:**\n\n1. **Obtain the Registered Deed** — Sale deed, succession certificate, or will\n2. **Visit Tehsil/Circle Office** — Submit the mutation application\n3. **Attach Documents:**\n   • Registered sale deed / death certificate + succession certificate\n   • Copy of existing Khatauni/ROR\n   • Identity proof\n   • Fee payment receipt\n4. **Verification** — Patwari verifies the claim and submits a report\n5. **Public Notice** — A notice period (usually 15-30 days) allows objections\n6. **Order by Tehsildar** — If no valid objections, mutation is approved\n7. **Updated Khatauni** — New records reflect your name\n\n**Timeline:** Typically 15-45 days\n**Fee:** Varies by state (usually ₹25-500)\n\n**Many states now offer online mutation:**\n• UP: vaad.up.nic.in\n• Bihar: biharbhumi.bihar.gov.in\n• Rajasthan: apnakhata.raj.nic.in\n\n📌 Share your state for specific portal details.`,
    ],
    followUp: 'Would you like guidance for mutation in a specific state?',
    suggestions: ['Required Documents', 'Land Records', 'Property Ownership']
  },

  land_fraud: {
    keywords: [
      'fraud', 'scam', 'fake', 'forgery', 'forged', 'cheated', 'cheating',
      'fraudulent', 'duplicate', 'impersonation', 'fake documents',
      'land grab', 'land mafia', 'benami',
      'धोखाधड़ी', 'फर्जी', 'जालसाजी', 'बेनामी', 'लैंड माफिया',
      'ठगी', 'नकली'
    ],
    patterns: [
      /land\s*(fraud|scam|cheat)/i,
      /property\s*(fraud|scam|cheat)/i,
      /fake\s*(document|deed|paper|registry)/i,
      /how\s+to\s+(prevent|avoid|detect|identify)\s+.*fraud/i,
      /धोखाधड़ी|फर्जी|जालसाजी|बेनामी/i
    ],
    responses: [
      `Land fraud is a serious concern. Here's how to protect yourself: 🛡️\n\n**Common Types of Land Fraud:**\n• Forged documents / fake sale deeds\n• Impersonation of the real owner\n• Selling the same property to multiple buyers\n• Benami (ownership in someone else's name) transactions\n• Encroachment and illegal possession\n• Fake power of attorney\n\n**How to Protect Yourself:**\n\n1. **Verify Title** — Check 30+ years of ownership history\n2. **Encumbrance Certificate** — Get EC for 13-30 years\n3. **Physical Visit** — Inspect the property and talk to neighbors\n4. **Match Survey Records** — Verify boundaries with Bhu Naksha/survey maps\n5. **Verify Seller Identity** — Cross-check Aadhaar, PAN with registered details\n6. **RERA Check** — For apartments, verify RERA registration\n7. **Legal Opinion** — Always get a lawyer to verify all documents\n8. **Sub-Registrar Verification** — Verify previous sale deeds at the SRO\n\n**If You're a Victim:**\n• File FIR at the local police station\n• Report to the Cyber Crime Cell (if online fraud)\n• File a complaint with the District Collector\n• Approach the Consumer Forum or Civil Court\n\n⚠️ *Never make payments without thorough verification. Always insist on registered documents.*`,
    ],
    followUp: 'Are you looking to verify a property before purchase, or have you encountered a fraud?',
    suggestions: ['Property Ownership', 'Required Documents', 'Land Records']
  },

  government_services: {
    keywords: [
      'government', 'govt', 'government service', 'government office',
      'tehsil', 'collectorate', 'revenue office', 'circle office',
      'patwari', 'lekhpal', 'tehsildar', 'collector', 'sdm',
      'सरकारी', 'तहसील', 'कलेक्ट्रेट', 'राजस्व कार्यालय',
      'पटवारी', 'लेखपाल', 'तहसीलदार', 'कलेक्टर'
    ],
    patterns: [
      /government\s*(service|office|portal|website|department)/i,
      /which\s*(office|authority|department)\s+(should|do|to)/i,
      /where\s+(to|should|do)\s+(go|visit|apply|file)/i,
      /contact\s+(information|details|number)/i,
      /सरकारी|तहसील|कलेक्ट्रेट/i
    ],
    responses: [
      `Here are the key government offices and services for land-related matters: 🏛️\n\n**Revenue Department Hierarchy:**\n• **Patwari/Lekhpal** — Village-level revenue officer (first point of contact)\n• **Tehsildar/Naib-Tehsildar** — Tehsil-level authority (mutations, revenue disputes)\n• **SDM (Sub-Divisional Magistrate)** — Sub-division level appeals\n• **District Collector/DM** — District-level authority (land acquisition, appeals)\n• **Commissioner** — Division-level\n• **Board of Revenue** — State-level appellate authority\n\n**Key Offices:**\n• **Sub-Registrar Office** — Property registration, encumbrance certificates\n• **Tehsil Office** — Mutations, revenue records, land surveys\n• **Town Planning Office** — Building permissions, land use\n• **Municipal Corporation** — Property tax, urban land matters\n\n**Online Portals:**\n• **CPGRAMS** (pgportal.gov.in) — Centralized public grievance\n• **DILRMP** — Digital India Land Records Modernization Programme\n• State-specific portals for land records\n\n📌 Which service or office are you looking for?`,
    ],
    suggestions: ['Land Records', 'Mutation Process', 'Application Delay']
  },

  property_verification: {
    keywords: [
      'verify', 'verification', 'check property', 'property check',
      'due diligence', 'authentic', 'genuine', 'legitimate',
      'encumbrance', 'clear title',
      'सत्यापन', 'जांच', 'वेरिफिकेशन'
    ],
    patterns: [
      /verify\s*(property|land|title|document|ownership)/i,
      /property\s*verification/i,
      /due\s*diligence/i,
      /is\s+(this|the|my)\s+(property|land|document)\s+(genuine|authentic|real|valid)/i,
      /encumbrance\s*certificate/i,
      /clear\s*title/i,
      /सत्यापन|वेरिफिकेशन/i
    ],
    responses: [
      `Here's a comprehensive property verification checklist: ✅\n\n**Essential Verification Steps:**\n\n1. **Title Verification**\n   • Trace ownership for 30+ years\n   • Check all previous sale deeds at the SRO\n   • Verify the seller's right to sell\n\n2. **Encumbrance Certificate (EC)**\n   • Obtain EC for 13-30 years\n   • Confirms no pending loans, mortgages, or litigation\n   • Available at Sub-Registrar office or online in some states\n\n3. **Revenue Records Check**\n   • Verify Khatauni/ROR matches the seller's name\n   • Check Bhu Naksha for correct boundaries\n   • Confirm the land area matches records\n\n4. **Physical Verification**\n   • Visit the property\n   • Check actual boundaries vs records\n   • Talk to neighbors about ownership history\n   • Check for encroachments\n\n5. **Legal & Regulatory Checks**\n   • Verify land use/zoning (agricultural, residential, commercial)\n   • Check if property falls under CRZ, forest, or restricted area\n   • Verify building plan approval (for structures)\n   • Check RERA registration (for apartments/plots by builders)\n\n6. **Tax & Dues**\n   • Verify property tax payments are current\n   • Check for any pending utility bills\n   • Confirm no pending government dues\n\n⚠️ *Always hire a qualified lawyer for property verification before any transaction.*`,
    ],
    suggestions: ['Property Ownership', 'Required Documents', 'Land Fraud']
  },

  terminology: {
    keywords: [
      'meaning', 'what is', 'what does', 'define', 'definition',
      'explain', 'term', 'terminology', 'glossary',
      'मतलब', 'अर्थ', 'क्या है', 'क्या होता है', 'बताइए'
    ],
    patterns: [
      /what\s+(is|does|are|means?)\s+(a\s+)?(khasra|khatauni|mutation|encumbrance|fard|jamabandi|intkal|ror|pahani|adangal|tippan|patta|chitta)/i,
      /meaning\s+of/i,
      /explain\s+(the\s+)?(term|meaning|concept)/i,
      /क्या है|क्या होता है|मतलब/i
    ],
    responses: [
      `Here are common land-related terms explained in simple language: 📖\n\n**Revenue Records:**\n• **Khasra** — Plot/field register with crop and area details\n• **Khatauni** — Ownership record listing all land held by an owner\n• **ROR (Record of Rights)** — Official document showing land ownership\n• **Jamabandi/Fard** — Revenue record used in Punjab, Haryana\n• **Pahani/Adangal** — Revenue record used in Andhra, Telangana, Karnataka\n• **Patta/Chitta** — Land records used in Tamil Nadu\n\n**Legal Terms:**\n• **Mutation (Dakhil Kharij)** — Updating owner's name in revenue records\n• **Encumbrance** — Any legal claim, lien, or charge on a property\n• **Sale Deed** — Legal document transferring ownership from seller to buyer\n• **Stamp Duty** — Tax paid to the government on property transactions\n• **NOC** — No Objection Certificate from relevant authorities\n• **Benami** — Property held in someone else's name\n\n**Survey Terms:**\n• **Survey Number** — Unique identification number for a land parcel\n• **Khasra Number** — Plot number in revenue records\n• **Bhu Naksha** — Revenue map showing plot boundaries\n\nWould you like a detailed explanation of any specific term?`,
    ],
    suggestions: ['Land Records', 'Required Documents', 'Property Ownership']
  },

  greeting: {
    keywords: [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'greetings', 'namaste', 'namaskar',
      'नमस्ते', 'नमस्कार', 'हेलो', 'हाय'
    ],
    patterns: [
      /^(hello|hi|hey|greetings|namaste|namaskar)\s*[!.?]?\s*$/i,
      /good\s+(morning|afternoon|evening)/i,
      /^(नमस्ते|नमस्कार|हेलो|हाय)\s*[!.?]?\s*$/i
    ],
    responses: [
      `Hello! 👋 Welcome to LandGuard AI Assistant.\n\nI can help you with:\n• 📄 Land Records & Revenue Documents\n• 🏠 Property Ownership Verification\n• 📝 Land Registration Process\n• 📋 Mutation (Dakhil Kharij)\n• 🗺️ Land Survey & Boundaries\n• ⚖️ Land Dispute Guidance\n• 📑 Required Documents\n• ⏳ Application Status & Delays\n• 🛡️ Land Fraud Prevention\n• 🏛️ Government Services\n\nHow can I help you today?`,
      `Namaste! 🙏 I'm the LandGuard AI Assistant.\n\nI'm here to help you with all land and property related questions. Just type your question in English or Hindi, and I'll guide you step by step.\n\nWhat would you like to know?`
    ],
    suggestions: ['Check Land Records', 'Property Ownership', 'Required Documents']
  },

  thanks: {
    keywords: [
      'thank', 'thanks', 'thank you', 'thankyou', 'appreciated', 'helpful',
      'great', 'awesome', 'perfect', 'wonderful', 'excellent',
      'धन्यवाद', 'शुक्रिया', 'बहुत अच्छा', 'बहुत बढ़िया'
    ],
    patterns: [
      /thank\s*(you|s)/i,
      /that('s|\s+is)\s+(helpful|great|perfect|awesome)/i,
      /धन्यवाद|शुक्रिया/i
    ],
    responses: [
      `You're welcome! 😊 I'm glad I could help.\n\nFeel free to ask me anything else about land records, property, registration, or any other land-related topic. I'm here to assist you!`,
      `Thank you for your kind words! 🙏\n\nIf you have any more questions about land or property matters, don't hesitate to ask. I'm always here to help!`
    ],
    suggestions: ['Check Land Records', 'Property Ownership', 'Land Registration']
  }
};

// ─── Default / Fallback Response ────────────────────────────────────────────

const FALLBACK_RESPONSES = [
  `I appreciate your question! While I specialize in land and property matters, I wasn't able to find a specific answer for that query. 🤔\n\nHere are the topics I can help you with:\n• 📄 Land Records (Bhulekh, Khasra, Khatauni)\n• 🏠 Property Ownership & Transfer\n• 📝 Land Registration\n• 📋 Mutation (Dakhil Kharij)\n• 🗺️ Land Survey & Boundaries\n• ⚖️ Land Disputes\n• 📑 Required Documents\n• ⏳ Application Delays\n• 🛡️ Land Fraud Prevention\n• 🏛️ Government Services\n\nCould you rephrase your question or pick one of these topics?`,
  `I'm specifically trained to help with land and property related matters. I couldn't match your question to my knowledge areas. 📌\n\nTry asking about:\n• How to check land records\n• Property ownership verification\n• Registration or mutation process\n• Required documents\n• Land disputes\n• Application status/delays\n\nPlease try rephrasing your question, and I'll do my best to help!`
];

// ─── Core Engine ────────────────────────────────────────────────────────────

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?!.,;:'"()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestMatch(userMessage: string): { topic: string; entry: KnowledgeEntry; score: number } | null {
  const normalized = normalizeText(userMessage);
  let bestMatch: { topic: string; entry: KnowledgeEntry; score: number } | null = null;

  for (const [topic, entry] of Object.entries(KNOWLEDGE_BASE)) {
    let score = 0;

    // Check regex patterns first (highest confidence)
    for (const pattern of entry.patterns) {
      if (pattern.test(userMessage)) {
        score += 10;
        break;
      }
    }

    // Check keyword matches
    for (const keyword of entry.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        score += 3;
      }
    }

    // Partial word matches
    const words = normalized.split(/\s+/);
    for (const word of words) {
      for (const keyword of entry.keywords) {
        const kwWords = keyword.toLowerCase().split(/\s+/);
        for (const kwWord of kwWords) {
          if (word === kwWord && word.length > 2) {
            score += 1;
          }
        }
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { topic, entry, score };
    }
  }

  return bestMatch;
}

function getLocalResponse(userMessage: string, _conversationHistory: ChatMessage[]): ChatMessage {
  // Check if user is asking about any of the 1,021 projects by ID
  const idMatch = userMessage.match(/LA-[A-Z]{2}-\d{4}-\d{4}/i);
  if (idMatch) {
    const projId = idMatch[0].toUpperCase();
    const proj = DEMO_PROJECTS.find(p => p.id.toUpperCase() === projId);
    if (proj) {
      return {
        id: generateId(),
        role: 'assistant',
        content: `📋 **Project Dossier: ${proj.name} (${proj.id})**\n\n` +
          `• **Location:** ${proj.district}, ${proj.state}\n` +
          `• **Sector:** ${proj.project_type}\n` +
          `• **Stage:** ${proj.current_stage}\n` +
          `• **AI Risk Level:** **${proj.risk_category}** (Risk Score: ${proj.risk_score}/10, Delay Probability: ${Math.round(proj.delay_probability * 100)}%)\n` +
          `• **Land Area:** ${proj.land_area_hectares} Ha (${proj.affected_families} Affected Families)\n` +
          `• **Compensation:** ${proj.compensation_percentage}% disbursed of ₹${proj.compensation_budget_cr} Cr budget\n` +
          `• **Key Bottleneck:** ${proj.bottleneck}\n\n` +
          `Would you like to inspect its acquisition timeline, view GIS coordinates, or review recommendations?`,
        timestamp: Date.now(),
        suggestions: ['Inspect Project', 'View GIS Map', 'System Recommendations']
      };
    }
  }

  const match = findBestMatch(userMessage);

  let content: string;
  let suggestions: string[] | undefined;

  if (match && match.score >= 3) {
    const responses = match.entry.responses;
    const responseIndex = Math.floor(Math.random() * responses.length);
    content = responses[responseIndex];
    
    if (match.entry.followUp) {
      content += `\n\n💬 *${match.entry.followUp}*`;
    }
    
    suggestions = match.entry.suggestions;
  } else {
    const fallbackIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
    content = FALLBACK_RESPONSES[fallbackIndex];
    suggestions = ['Check Land Records', 'Property Ownership', 'Required Documents'];
  }

  return {
    id: generateId(),
    role: 'assistant',
    content,
    timestamp: Date.now(),
    suggestions
  };
}

// ─── API Integration ────────────────────────────────────────────────────────

const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || '';

async function getApiResponse(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<ChatMessage | null> {
  if (!CHATBOT_API_URL) return null;

  try {
    const response = await fetch(`${CHATBOT_API_URL}/api/chatbot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        conversation_history: conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    return {
      id: generateId(),
      role: 'assistant',
      content: data.response,
      timestamp: Date.now(),
      suggestions: data.suggestions
    };
  } catch (error) {
    console.warn('Chatbot API failed, falling back to local engine:', error);
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Send a user message and get an AI response.
 * Tries the backend API first (if configured), then falls back to local NLP.
 */
export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<ChatMessage> {
  // Try API first
  const apiResponse = await getApiResponse(userMessage, conversationHistory);
  if (apiResponse) return apiResponse;

  // Fall back to local rule-based engine
  // Simulate realistic typing delay (300ms - 1200ms)
  const delay = 300 + Math.random() * 900;
  await new Promise(resolve => setTimeout(resolve, delay));

  return getLocalResponse(userMessage, conversationHistory);
}

/**
 * Get the welcome message for a new chat session.
 */
export function getWelcomeMessage(): ChatMessage {
  return {
    id: generateId(),
    role: 'assistant',
    content: `Hello! 👋 I am the **LandGuard AI Assistant**. I can help answer your questions about land, property records, documents, registration, disputes, and other land-related services.\n\nHow can I help you today?`,
    timestamp: Date.now(),
    suggestions: [
      'Check Land Records',
      'Property Ownership',
      'Required Documents',
      'Land Disputes',
      'Land Survey',
      'Application Delay'
    ]
  };
}

/**
 * Create a user message object.
 */
export function createUserMessage(content: string): ChatMessage {
  return {
    id: generateId(),
    role: 'user',
    content,
    timestamp: Date.now()
  };
}
