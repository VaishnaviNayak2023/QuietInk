from pathlib import Path

import pandas as pd
from joblib import load
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "model" / "safety_classifier.joblib"
TEST_PATH = ROOT / "data" / "processed" / "test.csv"


def main() -> None:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Trained model not found: {MODEL_PATH}")
    if not TEST_PATH.exists():
        raise FileNotFoundError(f"Test dataset not found: {TEST_PATH}")

    pipeline = load(MODEL_PATH)
    test_df = pd.read_csv(TEST_PATH)
    X_test = test_df[["age", "education", "employment", "income", "marital_status"]]
    y_test = test_df["violence"]

    predictions = pipeline.predict(X_test)
    probabilities = pipeline.predict_proba(X_test)[:, 1] if hasattr(pipeline, "predict_proba") else None

    print("Evaluation on test set")
    print(classification_report(y_test, predictions, digits=4))
    print("Confusion matrix:")
    print(confusion_matrix(y_test, predictions))
    if probabilities is not None:
        print(f"ROC AUC: {roc_auc_score(y_test, probabilities):.4f}")


if __name__ == "__main__":
    main()
