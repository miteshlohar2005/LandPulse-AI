import os
import sys
import json
import datetime
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from backend.app.core.config import settings
from ml.data_loader import load_dataset, get_feature_and_target_matrices
from ml.preprocessing import build_preprocessor

def train_and_evaluate_models(dataset_path: str = None) -> dict:
    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    df = load_dataset(dataset_path) if dataset_path else load_dataset()
    X, y_class, y_duration = get_feature_and_target_matrices(df)

    # Train/validation split (80/20 stratified)
    X_train, X_val, y_train, y_val, y_dur_train, y_dur_val = train_test_split(
        X, y_class, y_duration, test_size=0.2, random_state=42, stratify=y_class
    )

    preprocessor = build_preprocessor()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_val_proc = preprocessor.transform(X_val)

    # 1. Baseline: Logistic Regression
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train_proc, y_train)
    y_pred_lr = lr.predict(X_val_proc)
    y_prob_lr = lr.predict_proba(X_val_proc)[:, 1]

    lr_metrics = {
        "algorithm": "Logistic Regression",
        "accuracy": float(accuracy_score(y_val, y_pred_lr)),
        "precision": float(precision_score(y_val, y_pred_lr, zero_division=0)),
        "recall": float(recall_score(y_val, y_pred_lr, zero_division=0)),
        "f1_score": float(f1_score(y_val, y_pred_lr, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_val, y_prob_lr)),
        "confusion_matrix": confusion_matrix(y_val, y_pred_lr).tolist()
    }

    # 2. Random Forest
    rf = RandomForestClassifier(n_estimators=120, max_depth=10, random_state=42)
    rf.fit(X_train_proc, y_train)
    y_pred_rf = rf.predict(X_val_proc)
    y_prob_rf = rf.predict_proba(X_val_proc)[:, 1]

    rf_metrics = {
        "algorithm": "Random Forest",
        "accuracy": float(accuracy_score(y_val, y_pred_rf)),
        "precision": float(precision_score(y_val, y_pred_rf, zero_division=0)),
        "recall": float(recall_score(y_val, y_pred_rf, zero_division=0)),
        "f1_score": float(f1_score(y_val, y_pred_rf, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_val, y_prob_rf)),
        "confusion_matrix": confusion_matrix(y_val, y_pred_rf).tolist()
    }

    # 3. Gradient Boosting
    gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=5, random_state=42)
    gb.fit(X_train_proc, y_train)
    y_pred_gb = gb.predict(X_val_proc)
    y_prob_gb = gb.predict_proba(X_val_proc)[:, 1]

    gb_metrics = {
        "algorithm": "Gradient Boosting",
        "accuracy": float(accuracy_score(y_val, y_pred_gb)),
        "precision": float(precision_score(y_val, y_pred_gb, zero_division=0)),
        "recall": float(recall_score(y_val, y_pred_gb, zero_division=0)),
        "f1_score": float(f1_score(y_val, y_pred_gb, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_val, y_prob_gb)),
        "confusion_matrix": confusion_matrix(y_val, y_pred_gb).tolist()
    }

    # 4. Duration Regressor (Predicts actual days of delay)
    regressor = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    regressor.fit(X_train_proc, y_dur_train)

    # Select best model based on F1 Score and ROC-AUC
    candidates = [
        ("Logistic Regression", lr, lr_metrics),
        ("Random Forest", rf, rf_metrics),
        ("Gradient Boosting", gb, gb_metrics)
    ]
    best_name, best_clf, best_metrics = max(candidates, key=lambda c: c[2]["f1_score"] + c[2]["roc_auc"])

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    version = f"v1.{timestamp[:8]}-{best_name.lower().replace(' ', '')[:4]}"

    bundle = {
        "version": version,
        "algorithm": best_name,
        "preprocessor": preprocessor,
        "classifier": best_clf,
        "regressor": regressor,
        "metrics": best_metrics,
        "all_model_metrics": {
            "logistic_regression": lr_metrics,
            "random_forest": rf_metrics,
            "gradient_boosting": gb_metrics
        },
        "trained_at": datetime.datetime.utcnow().isoformat(),
        "train_records_count": len(df)
    }

    model_path = os.path.join(settings.MODEL_DIR, "active_model.joblib")
    joblib.dump(bundle, model_path)

    metadata_path = os.path.join(settings.MODEL_DIR, "model_metadata.json")
    metadata = {
        "version": version,
        "algorithm": best_name,
        "metrics": best_metrics,
        "all_model_metrics": bundle["all_model_metrics"],
        "trained_at": bundle["trained_at"],
        "train_records_count": bundle["train_records_count"]
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    return bundle

if __name__ == "__main__":
    res = train_and_evaluate_models()
    print("Training Complete!")
    print("Best Model:", res["algorithm"])
    print("Metrics:", res["metrics"])
