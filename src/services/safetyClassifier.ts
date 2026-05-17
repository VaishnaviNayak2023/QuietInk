import fs from "fs";
import path from "path";

export type SafetyProfile = {
  age: number;
  education: string;
  employment: string;
  income: number;
  maritalStatus: string;
};

type SafetyModel = {
  numeric_features: string[];
  categorical_features: string[];
  categories: Record<string, string[]>;
  coefficients: number[];
  intercept: number;
  feature_names: string[];
};

const MODEL_PATH = path.join(process.cwd(), "model", "safety_classifier.json");
let model: SafetyModel | null = null;

function loadModel(): SafetyModel {
  if (model) {
    return model;
  }

  const raw = fs.readFileSync(MODEL_PATH, "utf8");
  model = JSON.parse(raw) as SafetyModel;
  return model;
}

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeProfile(profile: SafetyProfile): SafetyProfile {
  return {
    age: Number(profile.age) || 0,
    income: Number(profile.income) || 0,
    education: normalizeValue(profile.education),
    employment: normalizeValue(profile.employment),
    maritalStatus: normalizeValue(profile.maritalStatus),
  };
}

export function classifySafetyProfile(profile: SafetyProfile) {
  const loaded = loadModel();
  const normalized = normalizeProfile(profile);
  const categoricalVectors = loaded.categorical_features.flatMap((feature) => {
    const value = feature === "marital_status" ? normalized.maritalStatus : (normalized as any)[feature];
    return loaded.categories[feature].map((category) => (category === value ? 1 : 0));
  });

  const numericVectors = loaded.numeric_features.map((feature) => {
    if (feature === "age") {
      return normalized.age;
    }
    if (feature === "income") {
      return normalized.income;
    }
    return 0;
  });

  const features = [...categoricalVectors, ...numericVectors];
  const linear = features.reduce((sum, value, index) => sum + value * loaded.coefficients[index], loaded.intercept);
  const probability = 1 / (1 + Math.exp(-linear));

  return {
    score: Number(probability.toFixed(4)),
    label: probability >= 0.5 ? "yes" : "no",
    isHighRisk: probability >= 0.60,
  };
}
