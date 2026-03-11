const request = require("supertest");
const path = require("path");
const fs = require("fs");
const app = require("../src/app");

// Mock services so tests don't require real API keys
jest.mock("../src/services/aiService", () => ({
  generateSalesSummary: jest.fn().mockResolvedValue({
    summary: "Mock AI summary for unit tests.",
    provider: "fallback",
  }),
}));

jest.mock("../src/services/emailService", () => ({
  sendSummaryEmail: jest.fn().mockResolvedValue(true),
}));

const CSV_PATH = path.join(__dirname, "../../sales_q1_2026.csv");

describe("POST /api/upload", () => {
  test("returns 400 when no file is provided", async () => {
    const res = await request(app)
      .post("/api/upload")
      .field("recipientEmail", "test@example.com");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("returns 422 when email is missing", async () => {
    const res = await request(app).post("/api/upload").attach("file", CSV_PATH);
    expect(res.status).toBe(422);
  });

  test("returns 422 when email is invalid", async () => {
    const res = await request(app)
      .post("/api/upload")
      .field("recipientEmail", "not-an-email")
      .attach("file", CSV_PATH);
    expect(res.status).toBe(422);
  });

  test("returns 200 with valid CSV and email", async () => {
    const res = await request(app)
      .post("/api/upload")
      .field("recipientEmail", "exec@rabbitt.ai")
      .attach("file", CSV_PATH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.rowsAnalyzed).toBeGreaterThan(0);
    expect(Array.isArray(res.body.columnsDetected)).toBe(true);
  });
});

describe("GET /api/health", () => {
  test("returns healthy status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});
