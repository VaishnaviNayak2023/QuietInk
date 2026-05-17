import json
from pathlib import Path

import pandas as pd
from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (classification_report, confusion_matrix,
                             roc_auc_score)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "model"
DATA_DIR = ROOT / "data" / "processed"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
TRAIN_PATH = DATA_DIR / "train.csv"
VAL_PATH = DATA_DIR / "validation.csv"

NUMERIC_FEATURES = ["age", "income"]
CATEGORICAL_FEATURES = ["education", "employment", "marital_status"]


def load_dataset(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Missing dataset file: {path}")
    df = pd.read_csv(path)
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["violence"]
    return X, y


def build_pipeline():
    preprocessor = ColumnTransformer(
        [
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
            (
                "numeric",
                StandardScaler(),
                NUMERIC_FEATURES,
            ),
        ],
        remainder="drop",
    )

    estimator = LogisticRegression(
        class_weight="balanced",
        max_iter=5000,
        random_state=42,
    )

    pipeline = Pipeline(
        [
            ("preprocessor", preprocessor),
            ("classifier", estimator),
        ]
    )
    return pipeline


def export_model_json(pipeline: Pipeline, model_path: Path) -> None:
    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]
    feature_names = preprocessor.get_feature_names_out()
    categories = preprocessor.named_transformers_["categorical"].categories_
    model_data = {
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "categories": {
            name: categories[idx].tolist()
            for idx, name in enumerate(CATEGORICAL_FEATURES)
        },
        "feature_names": feature_names.tolist(),
        "coefficients": classifier.coef_[0].tolist(),
        "intercept": float(classifier.intercept_[0]),
        "target_labels": {"no": 0, "yes": 1},
    }
    model_path.write_text(json.dumps(model_data, indent=2), encoding="utf-8")
    print(f"Exported model JSON to {model_path}")


def evaluate(pipeline: Pipeline, X, y, label: str) -> None:
    predictions = pipeline.predict(X)
    probabilities = pipeline.predict_proba(X)[:, 1] if hasattr(pipeline, "predict_proba") else None
    print(f"\nEvaluation on {label} set")
    print(classification_report(y, predictions, digits=4))
    print("Confusion matrix:")
    print(confusion_matrix(y, predictions))
    if probabilities is not None:
        print(f"ROC AUC: {roc_auc_score(y, probabilities):.4f}")


def main() -> None:
    X_train, y_train = load_dataset(TRAIN_PATH)
    X_val, y_val = load_dataset(VAL_PATH)

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    MODEL_PATH = MODEL_DIR / "safety_classifier.joblib"
    dump(pipeline, MODEL_PATH)
    print(f"Saved trained pipeline to {MODEL_PATH}")

    export_model_json(pipeline, MODEL_DIR / "safety_classifier.json")
    evaluate(pipeline, X_val, y_val, "validation")


if __name__ == "__main__":
    main()
