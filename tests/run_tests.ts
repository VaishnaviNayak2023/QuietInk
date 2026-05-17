import assert from "assert";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Writable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function runCommand(command: string, args: string[], cwd = ROOT): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed: ${command} ${args.join(" ")}\n${stderr}`));
      }
    });
  });
}

async function testPrepareData(): Promise<void> {
  console.log("Running prepare_data.py...");
  await runCommand("python", ["scripts/prepare_data.py"]);

  const expected = ["train.csv", "validation.csv", "test.csv"].map((name) =>
    path.join(ROOT, "data", "processed", name),
  );

  for (const filePath of expected) {
    assert.ok(fs.existsSync(filePath), `Expected ${filePath} to exist`);
  }
}

async function testTrainModel(): Promise<void> {
  console.log("Running train_model.py...");
  await runCommand("python", ["scripts/train_model.py"]);

  const joblibPath = path.join(ROOT, "model", "safety_classifier.joblib");
  const jsonPath = path.join(ROOT, "model", "safety_classifier.json");
  assert.ok(fs.existsSync(joblibPath), `Expected ${joblibPath} to exist`);
  assert.ok(fs.existsSync(jsonPath), `Expected ${jsonPath} to exist`);
}

async function testSafetyClassifier(): Promise<void> {
  console.log("Testing safety classifier inference...");
  const { classifySafetyProfile } = await import(pathToFileURL(path.join(ROOT, "src", "services", "safetyClassifier.ts")).href);

  const result = classifySafetyProfile({
    age: 30,
    education: "secondary",
    employment: "unemployed",
    income: 0,
    maritalStatus: "married",
  });

  assert.strictEqual(typeof result.score, "number");
  assert.ok(result.score >= 0 && result.score <= 1);
  assert.ok(["yes", "no"].includes(result.label));
  assert.strictEqual(typeof result.isHighRisk, "boolean");
}

async function testExportService(): Promise<void> {
  console.log("Testing PDF export service...");
  const { streamCsvBackup } = await import(pathToFileURL(path.join(ROOT, "src", "services", "exportService.js")).href);

  const headers: Record<string, string> = {};
  const chunks: Buffer[] = [];

  const res = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      callback();
    },
  }) as unknown as { setHeader: (k: string, v: string) => void; end: () => void; statusCode?: number };

  Object.assign(res, {
    setHeader(key: string, value: string) {
      headers[key.toLowerCase()] = value;
    },
  });

  await new Promise<void>((resolve, reject) => {
    try {
      streamCsvBackup(res, "data2");
      res.on("finish", () => resolve());
      res.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });

  assert.strictEqual(headers["content-type"], "application/pdf");
  const buffer = Buffer.concat(chunks);
  assert.ok(buffer.length > 100, "Expected PDF buffer content");
  assert.strictEqual(buffer.slice(0, 4).toString(), "%PDF");
}

async function run(): Promise<void> {
  try {
    await testPrepareData();
    await testTrainModel();
    await testSafetyClassifier();
    await testExportService();
    console.log("All tests passed.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
