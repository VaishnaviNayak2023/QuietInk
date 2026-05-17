# Chatbot ML Model Implementation Plan

## 1. Objective
- Use the data in `data/` to build an ML component that improves the chatbot's safety guidance.
- Because the current app already uses Gemini for response generation, the most practical use is to add a local classifier or retrieval module that detects / categorizes safety-related content and steers the assistant.
- The model should not replace Gemini; it should augment prompt selection, context, or safety scoring.

## 2. Current Architecture Summary
- Frontend: React + Vite.
- Backend: Express server in `server.ts`.
- AI integration: `@google/genai` is used to call Gemini with a safety-focused `SYSTEM_INSTRUCTION`.
- Existing knowledge base: `src/constants/library.ts`.

## 3. Dataset Summary
- `data/data1/Reporte_Delito_Violencia_Intrafamiliar_Polic_a_Nacional.csv`
  - Columns: `DEPARTAMENTO`, `MUNICIPIO`, `CODIGO DANE`, `ARMAS MEDIOS`, `FECHA HECHO`, `GENERO`, `GRUPO ETARIO`, `CANTIDAD`
  - This is incident report data; it can support risk profiling, pattern detection, and contextual features.
- `data/data2/Domestic violence.csv`
  - Columns: `SL. No`, `Age`, `Education`, `Employment`, `Income`, `Marital status`, `Violence`
  - This is a supervised dataset with `Violence` label suitable for training a binary classifier.

## 4. Proposed Model Use Cases
1. **Safety risk classifier**
   - Predict whether a user situation is likely related to domestic violence / safety risk.
   - Use as a trigger to choose a stronger safety prompt or escalate advice.
2. **Intent / issue categorization**
   - Map user input into categories like `emergency`, `legal rights`, `escape planning`, `safety resources`.
   - This can help the chatbot produce more relevant responses.
3. **Knowledge retrieval / scoring**
   - Use the dataset to support a fact-based retrieval layer for the assistant.
   - Example: infer whether a situation resembles known incident patterns before calling Gemini.

## 5. Implementation Steps

### Step 1: Define the exact ML goal
- Decide whether the model should classify raw user text, classify user-provided form data, or predict risk from profile attributes.
- Given the available CSVs, the strongest immediate model is a feature-based `violence yes/no` classifier.
- If you want a chat-oriented system, plan to convert user text into the same feature space via simple entity extraction.

### Step 2: Prepare the dataset
- Create a preprocessing script: `scripts/prepare_data.py` or `scripts/prepare_data.ts`.
- Normalize text encoding and remove accent issues.
- Standardize columns and merge if needed.
- For `data2`, clean values: `unemployed`, `tertiary`, `married`, `yes/no`.
- For `data1`, derive features such as:
  - `weapon_category` from `ARMAS MEDIOS`
  - `year`, `month` from `FECHA HECHO`
  - `gender`, `age_group`, `location`
  - `incident_count` from `CANTIDAD`
- Save processed output to `data/processed/`.

### Step 3: Build the training pipeline
- Choose a framework:
  - Python: `scikit-learn` for tabular models, `pandas` for preprocessing.
  - Node: `tensorflow.js` or `brain.js` if you want a JS-only approach.
- Recommended files:
  - `scripts/train_model.py`
  - `scripts/evaluate_model.py`
  - `scripts/save_model.py`
- Train on `data/processed/train.csv`, validate on `data/processed/validation.csv`.
- Save a model artifact: `model/safety_classifier.pkl` or `model/safety_classifier.json`.

### Step 4: Evaluate carefully
- Use `train/test` or `train/validation/test` split.
- Evaluate metrics:
  - Precision, recall, F1-score.
  - Confusion matrix.
- For safety detection, prioritize recall on the positive class (`Violence=yes`) to reduce missed risk cases.
- Optionally add cross-validation.

### Step 5: Integrate into the backend
- Add a new backend inference module, e.g. `src/services/safetyClassifier.ts` or `server.ts` helper.
- Add an endpoint like `/api/safety-check` that accepts:
  - free text, or
  - structured attributes extracted from user input.
- Use the classifier output to:
  - adjust `SYSTEM_INSTRUCTION` before calling Gemini,
  - append a safety context block,
  - or choose different response templates.
- Example: if the classifier predicts high risk, prepend `The user appears to be in immediate danger. Prioritize emergency help and safe exit planning.`

### Step 6: Make training repeatable
- Add scripts or npm commands for training:
  - `npm run prepare-data`
  - `npm run train-model`
- Document dependencies and environment requirements.
- Keep training separate from application runtime.

### Step 7: Document and test
- Create a `README` section or new markdown file with:
  - dataset source and format,
  - training commands,
  - model purpose,
  - integration flow.
- Add validation tests for the classifier pipeline.
- Add sample inputs and expected outputs to ensure the model behaves safely.

## 6. Short-Term Minimum Viable Implementation
1. Use `data/data2/Domestic violence.csv` to train a binary classifier.
2. Add a simple Python script to preprocess and train.
3. Deploy inference logic in the backend to score user input or form data.
4. Use the score to strengthen prompt conditioning for Gemini.

## 7. Long-Term Extensions
- Collect actual chat transcripts or safety-related user queries for fine-tuning.
- Build an embeddings-based retrieval system over `src/constants/library.ts` + processed dataset facts.
- Add a custom prompt manager that chooses responses based on classifier confidence.

## 8. Risks & Important Notes
- The current dataset is not conversational data; it is tabular incident / survey data.
- This means the ML model will be best for classification or context detection, not end-to-end chatbot generation.
- The safest architecture is to keep Gemini as the language model and use the local model as an augmenting signal.

---

### Quick first implementation path
- `python scripts/prepare_data.py`
- `python scripts/train_model.py`
- `python scripts/evaluate_model.py`
- `node server.ts`

This plan gives you a direct way to convert the available CSV files into a useful ML component for your chatbot.
