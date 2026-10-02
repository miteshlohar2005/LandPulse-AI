# 🌍 LandPulse AI

### Predict Land Acquisition Delays. Prevent Project Bottlenecks.

LandPulse AI is an AI-powered predictive analytics and decision-support platform designed to identify potential delays in land acquisition processes before they become critical.

Large infrastructure projects such as highways, railways, irrigation systems, renewable energy parks, industrial corridors, and urban development projects often depend on timely land acquisition. Delays in compensation, documentation, legal disputes, approvals, rehabilitation, and possession can significantly affect project timelines.

LandPulse AI brings these factors together into a single platform and uses machine learning, explainable AI, GIS visualization, and risk analytics to help project authorities identify bottlenecks early and take informed action.

---

## 🚨 The Problem

Land acquisition is a multi-stage process involving multiple departments, stakeholders, legal procedures, documentation, compensation, rehabilitation, and physical possession.

A delay in one stage can create a chain reaction across the entire infrastructure project.

Common causes of delay include:

- Pending compensation payments
- Legal and ownership disputes
- Incomplete land documentation
- Delayed statutory approvals
- Survey and demarcation issues
- Slow stakeholder response
- Rehabilitation and resettlement delays
- Low progress in physical possession
- Administrative bottlenecks
- Historical delays in specific regions

Traditional systems generally focus on recording and monitoring existing information.

The major challenge is:

> **How can potential land acquisition delays be identified early enough to take preventive action?**

---

## 💡 Our Solution

LandPulse AI converts land acquisition data into actionable risk intelligence.

The platform analyzes project-level information and produces:

- 📊 Overall Risk Score
- 📈 Delay Probability
- ⏳ Predicted Additional Delay
- 🧠 Explainable AI Risk Factors
- 🗺️ Geographic Risk Visualization
- 🚨 Automated Risk Alerts
- 💡 Recommended Actions
- 📅 Acquisition Stage Tracking
- 📋 Project Performance Analytics

Instead of simply showing what has already gone wrong, LandPulse AI focuses on identifying **where a project is likely to face problems next**.

---

# ✨ Key Features

## 🤖 AI-Powered Risk Prediction

LandPulse AI uses machine learning models to estimate the probability of land acquisition delays.

The system supports multiple models including:

- Logistic Regression
- Random Forest
- Gradient Boosting
- Random Forest Regression

The training pipeline evaluates model performance using:

- Accuracy
- Precision
- Recall
- F1 Score
- ROC-AUC

The best-performing model can be selected for prediction.

---

## 🧠 Explainable AI

Prediction alone is not enough.

LandPulse AI explains the major factors contributing to the predicted risk.

Example:

```text
Risk Score: 8.4 / 10

Major Risk Factors:

Pending Compensation       +27%
Legal Disputes              +21%
Statutory Clearance         +17%
Incomplete Documentation    +11%

Stakeholder Engagement       -7%

This allows users to understand:
Why is this project at risk?

rather than receiving only a prediction.
🗺️ GIS Risk Map
LandPulse AI provides an interactive geographic view of projects.
The GIS module helps users:
- Locate projects geographically
- Visualize project risk
- Identify high-risk regions
- Compare project locations
- Analyze district-level patterns
- Track geographic concentration of delays
Built using:
- Leaflet
- OpenStreetMap
- GeoJSON
📋 Land Acquisition Lifecycle
The system models the acquisition process through multiple stages:
Preliminary Investigation
          ↓
Notification
          ↓
Land Survey & Demarcation
          ↓
Objection / Legal Hearing
          ↓
Compensation Assessment
          ↓
Compensation Disbursement
          ↓
Rehabilitation & Resettlement
          ↓
Physical Possession
          ↓
Final Acquisition

Each stage can contribute different levels of risk to the overall project.
🚨 Smart Alerts
LandPulse AI can identify projects crossing defined risk thresholds and generate alerts.
Example:
⚠ High Risk Detected

Project: Infrastructure Project A

Risk Score: 8.4 / 10
Delay Probability: 84%
Expected Additional Delay: 68 Days

Primary Issue:
Pending compensation + active legal disputes

Recommended Action:
Prioritize compensation verification
and legal resolution.

💡 Recommendation Engine
The platform converts identified bottlenecks into actionable recommendations.
Examples:
- Expedite compensation processing
- Review pending legal cases
- Complete documentation verification
- Prioritize land survey
- Improve stakeholder coordination
- Monitor rehabilitation progress
This helps move from:
Prediction
    ↓
Explanation
    ↓
Recommendation
    ↓
Action

👥 Role-Based Access
LandPulse AI supports role-based access for different categories of users.
Role	Capabilities
Administrator	System administration, analytics and model management
State Officer	State-level monitoring and risk analysis
District Officer	District-level project monitoring
Project Manager	Project progress and milestone management
Viewer / Analyst	Read-only analytics and reports


🏗️ System Architecture
                    LANDPULSE AI
                         │
                         ▼
              ┌─────────────────────┐
              │   React Frontend    │
              │ React + TypeScript  │
              │ Vite + Tailwind     │
              └──────────┬──────────┘
                         │
                    REST / JSON
                         │
                         ▼
              ┌─────────────────────┐
              │   FastAPI Backend   │
              │ Authentication      │
              │ Projects & Analytics│
              │ Alerts & APIs       │
              └──────────┬──────────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐
    │  ML / XAI       │     │   Database      │
    │                 │     │                 │
    │ Risk Prediction │     │ SQLite          │
    │ Delay Forecast  │     │ PostgreSQL      │
    │ XAI Analysis    │     │ SQLAlchemy      │
    └─────────────────┘     └─────────────────┘

🧠 Machine Learning Pipeline
Historical / Demo Data
          ↓
Data Cleaning
          ↓
Feature Engineering
          ↓
Risk Factor Analysis
          ↓
Model Training
          ↓
Model Evaluation
          ↓
Best Model Selection
          ↓
Risk Prediction
          ↓
Explainable AI
          ↓
Recommendations
          ↓
Alerts & Dashboard

📊 Prediction Factors
The model can analyze factors such as:
- Land area
- Number of affected families
- Compensation progress
- Approval delay
- Number of legal disputes
- Documentation completeness
- Notification status
- Possession progress
- Rehabilitation progress
- Stakeholder responsiveness
- Historical regional delay score
- Current acquisition stage
- Project type
- State / region
These features help create a more comprehensive project risk profile.
🛠️ Technology Stack
Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Leaflet
- Recharts
- Lucide Icons
Backend
- Python
- FastAPI
- SQLAlchemy
- JWT Authentication
- REST APIs
Machine Learning
- Scikit-learn
- Random Forest
- Gradient Boosting
- Logistic Regression
- Random Forest Regression
- Explainable AI
Database
- SQLite
- PostgreSQL
- SQLAlchemy ORM
Development & Deployment
- Docker
- Docker Compose
- Vercel
- Python Virtual Environment
📁 Project Structure
LandPulse-AI/
│
├── backend/
│   └── app/
│       ├── api/
│       ├── auth/
│       ├── core/
│       ├── database/
│       ├── models/
│       └── schemas/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── data/
│       └── types/
│
├── ml/
│   ├── data/
│   ├── saved_models/
│   ├── clean_data.py
│   ├── preprocessing.py
│   ├── train.py
│   ├── predict.py
│   ├── explain.py
│   └── recommendation_engine.py
│
├── scripts/
│   └── generate_demo_data.py
│
├── tests/
│   └── test_backend.py
│
├── prisma/
│   └── schema.prisma
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md

🚀 Getting Started
Prerequisites
Make sure you have installed:
- Python 3.10+
- Node.js 18+
- npm
- Git
1. Clone the Repository
git clone https://github.com/miteshlohar2005/LandPulse-AI.git
cd LandPulse-AI

2. Create Python Virtual Environment
Windows
python -m venv .venv
.venv\Scripts\activate

Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

3. Install Backend Dependencies
pip install -r requirements.txt

4. Generate Demo Data
python scripts/generate_demo_data.py

5. Train the ML Models
python ml/train.py

6. Install Frontend Dependencies
cd frontend
npm install
cd ..

▶️ Run the Application
Backend
uvicorn backend.app.main:app --reload --port 8000

Backend:
http://localhost:8000

API documentation:
http://localhost:8000/api/docs

Frontend
Open another terminal:
cd frontend
npm run dev

Frontend:
http://localhost:5173

🐳 Docker
The application can also be started using Docker:
docker-compose up --build

Then open:
http://localhost:8000

🧪 Testing
Run the backend test suite:
pytest tests/test_backend.py -v

The test suite covers areas such as:
- API health
- Database connectivity
- Authentication
- Role authorization
- Dashboard analytics
- Project filtering
- Prediction API
- GIS endpoints
- Alerts
- Model management
📈 Example Risk Assessment
Project
────────────────────────────────────
Infrastructure Project A

Risk Score             8.4 / 10
Delay Probability      84%
Expected Delay         68 Days
Risk Level             HIGH

Major Contributors
────────────────────────────────────
Pending Compensation       High
Legal Disputes             High
Approval Delay             Medium
Documentation              Medium

Recommended Actions
────────────────────────────────────
✓ Verify pending compensation
✓ Review legal disputes
✓ Complete documentation
✓ Monitor statutory approvals

🎯 Real-World Applications
LandPulse AI can be adapted for monitoring land acquisition associated with:
- 🛣️ Highway and expressway projects
- 🚆 Railway infrastructure
- 💧 Irrigation and water projects
- ⚡ Renewable energy projects
- 🏭 Industrial corridors
- 🏙️ Urban infrastructure
- ⛏️ Mining projects
- 🚇 Metro and transportation projects
🔮 Future Enhancements
Planned improvements include:
- Satellite imagery integration
- Automated land-progress monitoring
- Integration with digital land-record systems
- SMS / WhatsApp alert integration
- Advanced time-series forecasting
- Natural-language legal document analysis
- Real-time project data synchronization
- Mobile application
- Advanced regional risk forecasting
🔐 Data & Disclaimer
The current repository uses synthetic demonstration data for development, testing, and system demonstration.
The predictions generated by the system should not be treated as official legal, financial, or administrative decisions.
For real-world deployment, the platform would require integration with verified land records, project databases, legal information, and authorized institutional data sources.
👨‍💻 Developer
Mitesh Ramesh Lohar
Computer Engineering Student
India
Connect
- GitHub: https://github.com/miteshlohar2005
- LinkedIn: https://www.linkedin.com/in/mitesh-ramesh-lohar/
📄 License
This project is intended for educational, research, and demonstration purposes.
