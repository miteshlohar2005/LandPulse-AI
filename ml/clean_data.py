import re
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any

STATE_MAPPINGS = {
    "jh": "Jharkhand", "jharkhand": "Jharkhand",
    "mh": "Maharashtra", "maharashtra": "Maharashtra",
    "od": "Odisha", "orissa": "Odisha", "odisha": "Odisha",
    "ka": "Karnataka", "karnataka": "Karnataka",
    "tn": "Tamil Nadu", "tamil nadu": "Tamil Nadu",
    "up": "Uttar Pradesh", "uttar pradesh": "Uttar Pradesh",
    "gj": "Gujarat", "gujarat": "Gujarat",
    "rj": "Rajasthan", "rajasthan": "Rajasthan",
    "wb": "West Bengal", "west bengal": "West Bengal",
    "mp": "Madhya Pradesh", "madhya pradesh": "Madhya Pradesh",
    "pb": "Punjab", "punjab": "Punjab",
    "hr": "Haryana", "haryana": "Haryana",
    "ts": "Telangana", "telangana": "Telangana",
    "ap": "Andhra Pradesh", "andhra pradesh": "Andhra Pradesh"
}

SECTOR_MAPPINGS = {
    "nh": "Highways", "highway": "Highways", "highways": "Highways", "expressway": "Highways", "road": "Highways",
    "rail": "Railways", "railway": "Railways", "railways": "Railways", "dfc": "Railways",
    "mine": "Mining", "mining": "Mining", "coal": "Mining",
    "dam": "Irrigation", "irrigation": "Irrigation", "canal": "Irrigation", "reservoir": "Irrigation",
    "solar": "Energy", "wind": "Energy", "power": "Energy", "energy": "Energy",
    "metro": "Urban", "urban": "Urban", "smart city": "Urban"
}

def parse_currency_to_float(val: Any) -> float:
    if pd.isnull(val) or str(val).strip().lower() in ("nan", "none", "", "null"):
        return 0.0
    val_str = str(val).replace(",", "").replace("₹", "").replace("$", "").strip()
    match = re.search(r"[-+]?\d*\.?\d+", val_str)
    if not match:
        return 0.0
    num = float(match.group())
    if "lakh" in val_str.lower():
        num = num / 100.0  # Convert Lakhs to Crores
    elif "thousand" in val_str.lower() or "k" in val_str.lower():
        num = num / 10000.0
    return round(num, 2)

def clean_landguard_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Executes automated data cleaning & preprocessing pipeline for LandGuard AI datasets:
    1. Remove duplicate projects
    2. Remove unnecessary columns
    3. Fix missing values
    4. Convert costs to numbers
    5. Convert dates to datetime
    6. Standardize state and sector names
    7. Handle invalid values
    8. Detect extreme outliers
    """
    df = df.copy()
    report = {
        "initial_rows": len(df),
        "duplicates_removed": 0,
        "columns_dropped": [],
        "missing_imputed": {},
        "outliers_detected": 0,
        "invalid_values_fixed": 0
    }

    # 1. Remove duplicate projects
    initial_len = len(df)
    if "project_id" in df.columns:
        df = df.drop_duplicates(subset=["project_id"], keep="first")
    elif "name" in df.columns and "state" in df.columns:
        df = df.drop_duplicates(subset=["name", "state"], keep="first")
    elif "project_name" in df.columns and "state" in df.columns:
        df = df.drop_duplicates(subset=["project_name", "state"], keep="first")
    report["duplicates_removed"] = initial_len - len(df)

    # 2. Remove unnecessary columns
    unnecessary_cols = [
        c for c in df.columns 
        if c.startswith("Unnamed") or c in ["temp_id", "notes", "raw_dump", "junk_flag", "extra_col"]
    ]
    if unnecessary_cols:
        df = df.drop(columns=unnecessary_cols)
        report["columns_dropped"] = unnecessary_cols

    # 3. Convert costs to numbers
    cost_cols = [
        "original_cost", "revised_cost", "expenditure", 
        "compensation_budget_cr", "compensation_disbursed_cr"
    ]
    for col in cost_cols:
        if col in df.columns:
            df[col] = df[col].apply(parse_currency_to_float)

    # 4. Convert dates to datetime
    date_cols = [
        "start_date", "expected_completion_date", "original_completion_date", 
        "actual_completion_date", "created_at", "updated_at"
    ]
    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    # 5. Standardize state and sector names
    if "state" in df.columns:
        df["state"] = df["state"].astype(str).str.strip().map(
            lambda x: STATE_MAPPINGS.get(x.lower(), x.title()) if x.lower() not in ("nan", "none") else "Jharkhand"
        )
    if "sector" in df.columns:
        df["sector"] = df["sector"].astype(str).str.strip().map(
            lambda x: SECTOR_MAPPINGS.get(x.lower(), x.title()) if x.lower() not in ("nan", "none") else "Highways"
        )
    if "project_type" in df.columns:
        df["project_type"] = df["project_type"].astype(str).str.strip().map(
            lambda x: SECTOR_MAPPINGS.get(x.lower(), x.title()) if x.lower() not in ("nan", "none") else "Highways"
        )

    # 6. Handle invalid values & domain boundaries
    pct_cols = [
        "physical_progress", "compensation_percentage", "possession_percentage", 
        "rehabilitation_percentage", "document_completion_percentage", "land_acquisition_progress"
    ]
    for col in pct_cols:
        if col in df.columns:
            invalid_cnt = ((df[col] < 0) | (df[col] > 100)).sum()
            report["invalid_values_fixed"] += int(invalid_cnt)
            df[col] = pd.to_numeric(df[col], errors="coerce").clip(0.0, 100.0)

    non_neg_cols = [
        "land_area_hectares", "affected_families", "approval_delay_days", 
        "legal_disputes_count", "compensation_delay_days", "land_required", "land_acquired"
    ]
    for col in non_neg_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            invalid_cnt = (df[col] < 0).sum()
            report["invalid_values_fixed"] += int(invalid_cnt)
            df[col] = df[col].apply(lambda x: max(x, 0) if pd.notnull(x) else np.nan)

    # 7. Fix missing values
    num_cols = df.select_dtypes(include=[np.number]).columns
    for col in num_cols:
        null_count = df[col].isnull().sum()
        if null_count > 0:
            median_val = df[col].median()
            fill_val = median_val if pd.notnull(median_val) else 0.0
            df[col] = df[col].fillna(fill_val)
            report["missing_imputed"][col] = round(float(fill_val), 2)

    cat_cols = df.select_dtypes(include=["object"]).columns
    for col in cat_cols:
        null_count = df[col].isnull().sum()
        if null_count > 0:
            mode_series = df[col].mode()
            fill_val = mode_series[0] if not mode_series.empty else "Unknown"
            df[col] = df[col].fillna(fill_val)
            report["missing_imputed"][col] = fill_val

    # 8. Detect extreme outliers (IQR thresholding)
    outlier_cols = ["approval_delay_days", "legal_disputes_count", "land_area_hectares", "original_cost"]
    for col in outlier_cols:
        if col in df.columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            upper_bound = Q3 + 3.0 * IQR
            if upper_bound > 0:
                outliers = (df[col] > upper_bound).sum()
                report["outliers_detected"] += int(outliers)
                df[col] = np.where(df[col] > upper_bound, upper_bound, df[col])

    # 9. Derived Feature Engineering (Cost Overrun %, Financial Progress %, Execution Lag)
    df = compute_derived_features(df)

    report["final_rows"] = len(df)
    return df, report

def compute_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes key financial and schedule derived indicators safely:
    - cost_overrun_pct: ((revised_cost - original_cost) / original_cost) * 100
    - financial_progress_pct: (expenditure / revised_cost) * 100
    - execution_lag_pct: financial_progress_pct - physical_progress
    - time_overrun_days: actual_completion_date - original_completion_date
    """
    df = df.copy()

    # Cost Overrun Percentage (with zero-division & NaN protection)
    if "revised_cost" in df.columns and "original_cost" in df.columns:
        df["cost_overrun_pct"] = np.where(
            df["original_cost"] > 0,
            ((df["revised_cost"] - df["original_cost"]) / df["original_cost"]) * 100.0,
            0.0
        )
        df["cost_overrun_pct"] = df["cost_overrun_pct"].replace([np.inf, -np.inf], np.nan).fillna(0.0).round(2)

    # Financial Progress Percentage & Expenditure Ratio (with zero-division protection)
    if "expenditure" in df.columns and "revised_cost" in df.columns:
        df["expenditure_ratio"] = np.where(
            df["revised_cost"] > 0,
            (df["expenditure"] / df["revised_cost"]) * 100.0,
            0.0
        )
        df["expenditure_ratio"] = df["expenditure_ratio"].replace([np.inf, -np.inf], np.nan).fillna(0.0).round(2)
        df["financial_progress_pct"] = df["expenditure_ratio"]


    # Land Acquisition Progress Percentage (with zero-division & [0, 100]% boundary clipping)
    if "land_acquired" in df.columns and "land_required" in df.columns:
        df["land_acquisition_progress"] = np.where(
            df["land_required"] > 0,
            (df["land_acquired"] / df["land_required"]) * 100.0,
            0.0
        )
        df["land_acquisition_progress"] = (
            df["land_acquisition_progress"]
            .replace([np.inf, -np.inf], np.nan)
            .fillna(0.0)
            .clip(0.0, 100.0)
            .round(2)
        )
        df["possession_percentage"] = df["land_acquisition_progress"]

    # Execution Lag Percentage
    if "financial_progress_pct" in df.columns and "physical_progress" in df.columns:
        df["execution_lag_pct"] = (df["financial_progress_pct"] - df["physical_progress"]).round(2)

    # Schedule Delay Days & Time Overrun Calculation (with NaT & datetime string handling)
    if "actual_completion_date" in df.columns and "original_completion_date" in df.columns:
        actual_dt = pd.to_datetime(df["actual_completion_date"], errors="coerce")
        original_dt = pd.to_datetime(df["original_completion_date"], errors="coerce")
        
        delta_days = (actual_dt - original_dt).dt.days
        df["delay_days"] = delta_days.fillna(0).astype(int)
        df["time_overrun_days"] = df["delay_days"]

    return df



