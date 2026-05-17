from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = ROOT / "data" / "data2" / "Domestic violence.csv"
OUTPUT_DIR = ROOT / "data" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

VALID_EDUCATION = {"primary", "secondary", "tertiary", "none"}
VALID_EMPLOYMENT = {"unemployed", "semi employed", "employed"}
VALID_MARITAL = {"married", "unmarred"}
VALID_VIOLENCE = {"yes", "no"}


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [col.strip().replace(" ", "_").lower() for col in df.columns]
    return df


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = normalize_columns(df)
    keep_columns = ["age", "education", "employment", "income", "marital_status", "violence"]
    df = df[keep_columns]
    df["education"] = df["education"].astype(str).str.strip().str.lower()
    df["employment"] = df["employment"].astype(str).str.strip().str.lower()
    df["marital_status"] = df["marital_status"].astype(str).str.strip().str.lower()
    df["violence"] = df["violence"].astype(str).str.strip().str.lower()
    df["age"] = pd.to_numeric(df["age"], errors="coerce")
    df["income"] = pd.to_numeric(df["income"], errors="coerce")
    df = df.dropna(subset=keep_columns)
    df = df[df["education"].isin(VALID_EDUCATION)]
    df = df[df["employment"].isin(VALID_EMPLOYMENT)]
    df = df[df["marital_status"].isin(VALID_MARITAL)]
    df = df[df["violence"].isin(VALID_VIOLENCE)]
    return df


def save_split(name: str, x: pd.DataFrame, y: pd.Series) -> None:
    out = x.copy()
    out["violence"] = y
    out_path = OUTPUT_DIR / f"{name}.csv"
    out.to_csv(out_path, index=False)
    print(f"Saved {name} split to {out_path} ({len(out)} rows)")


def main() -> None:
    if not RAW_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {RAW_PATH}")

    df = pd.read_csv(RAW_PATH)
    df = clean_dataframe(df)

    if df.empty:
        raise RuntimeError("No valid rows remain after cleaning.")

    print(f"Loaded {len(df)} rows after cleaning.")
    print(df["violence"].value_counts())

    x = df.drop(columns=["violence"])
    y = df["violence"].map({"no": 0, "yes": 1})

    x_train, x_holdout, y_train, y_holdout = train_test_split(
        x,
        y,
        test_size=0.30,
        stratify=y,
        random_state=42,
    )
    x_val, x_test, y_val, y_test = train_test_split(
        x_holdout,
        y_holdout,
        test_size=0.50,
        stratify=y_holdout,
        random_state=42,
    )

    save_split("train", x_train, y_train)
    save_split("validation", x_val, y_val)
    save_split("test", x_test, y_test)

    print("Split distribution:")
    print("Train:", y_train.value_counts().to_dict())
    print("Validation:", y_val.value_counts().to_dict())
    print("Test:", y_test.value_counts().to_dict())


if __name__ == "__main__":
    main()
