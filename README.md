<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d862591e-5bec-4de7-a20f-c312fff090aa

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMMA_API_KEY` in [.env.local](.env.local) to your Gemma API key
3. Run the app:
   `npm run dev`

## Training the Safety Classifier

This project includes a small safety classifier trained from `data/data2/Domestic violence.csv`.

1. Install Python dependencies:
   `py -m pip install -r requirements.txt`
2. Prepare the dataset:
   `npm run prepare-data`
3. Train the model:
   `npm run train-model`
4. Evaluate the trained model:
   `npm run evaluate-model`

## New Backend APIs

- `POST /api/safety-check`
  - Expects a `profile` object containing `age`, `education`, `employment`, `income`, and `maritalStatus`.
  - Returns a safety risk score and label.
- `POST /api/chat`
  - Supports an optional `profile` object in the request body.
  - If the classifier detects elevated risk, the backend strengthens the system instruction before sending the query to Gemma.

## Exporting Backups as PDF

You can export CSV-based backups as a PDF document via the backend.

- `GET /api/export-backup?source=data2` — exports `data/data2/Domestic violence.csv` as a PDF
- `GET /api/export-backup?source=data1` — exports `data/data1/Reporte_...csv` as a PDF
- `GET /api/export-backup?source=processed` — exports `data/processed/train.csv` as a PDF

Example:

```bash
curl -o backup.pdf "http://localhost:3000/api/export-backup?source=data2"
```

## Running Tests

This repository includes a lightweight test harness that validates:

- data preparation (`scripts/prepare_data.py`)
- model training and export (`scripts/train_model.py`)
- classifier inference (`src/services/safetyClassifier.ts`)
- PDF backup export service (`src/services/exportService.js`)

Run the suite with:

```bash
npm test
```

## Exporting Backups as PDF

You can export CSV-based backups as a PDF document via the backend.

- `GET /api/export-backup?source=data2` — exports `data/data2/Domestic violence.csv` as a PDF
- `GET /api/export-backup?source=data1` — exports `data/data1/Reporte_...csv` as a PDF
- `GET /api/export-backup?source=processed` — exports `data/processed/train.csv` as a PDF

Before using this endpoint, install the PDF dependency:

```bash
npm install pdfkit
```

Example:

```bash
curl -o backup.pdf "http://localhost:3000/api/export-backup?source=data2"
```
