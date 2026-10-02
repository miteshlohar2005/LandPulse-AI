import os
import pandas as pd
from typing import Tuple

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "demo_projects.csv")

FEATURE_COLUMNS = [
    "land_area_hectares",
    "affected_families",
    "compensation_percentage",
    "approval_delay_days",
    "legal_disputes_count",
    "documentation_complete",
    "notification_complete",
    "possession_percentage",
    "rehabilitation_percentage",
    "historical_district_delay_score",
    "project_type",
    "current_stage",
    "stakeholder_responsiveness",
    "state"
]

TARGET_COLUMN = "delayed_flag"
DURATION_TARGET_COLUMN = "actual_delay_days"

def load_dataset(file_path: str = DATA_FILE) -> pd.DataFrame:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at: {file_path}. Please run generate_demo_data.py first.")
    df = pd.read_csv(file_path)
    return df

def get_feature_and_target_matrices(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    X = df[FEATURE_COLUMNS].copy()
    y_class = df[TARGET_COLUMN].copy()
    y_duration = df[DURATION_TARGET_COLUMN].copy()
    return X, y_class, y_duration
