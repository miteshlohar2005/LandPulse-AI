import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

NUMERIC_FEATURES = [
    "original_cost",
    "revised_cost",
    "expenditure",
    "physical_progress",
    "land_acquisition_progress",
    "compensation_delay_days",
    "legal_cases_count",
    "approval_delay_days",
    "document_completion_percentage",
    "cost_overrun_pct",
    "expenditure_ratio"
]

CATEGORICAL_FEATURES = [
    "sector",
    "state"
]

ALL_13_FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES

def build_preprocessor() -> ColumnTransformer:
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor

