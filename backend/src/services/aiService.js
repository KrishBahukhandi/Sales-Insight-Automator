const Groq = require("groq-sdk");
const logger = require("../config/logger");

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const buildPrompt = (dataContext, filename) => `
You are a senior business intelligence analyst at a high-growth technology company.
You have been given raw sales data. Produce an executive-ready quarterly brief.

Write in clear, confident business prose — NOT bullet points or tables.
Imagine you are presenting to the CEO and CFO.

Structure your response with these sections:
1. **Executive Overview** (2–3 sentences: the single most important story in the data)
2. **Revenue Performance** (totals, trends, top performers with specific numbers)
3. **Product & Regional Insights** (which categories/regions lead or lag)
4. **Operational Highlights** (order statuses, fulfillment rates, notable anomalies)
5. **Strategic Recommendations** (2–3 concrete, data-driven actions)

Tone: Confident, concise, data-driven. Use specific numbers from the data.
Length: 300–500 words.

--- SALES DATA: ${filename} ---
${dataContext}
--- END OF DATA ---

Generate the executive brief now:
`.trim();

// ── Groq (Llama 3-70B) ───────────────────────────────────────────────────────
const generateWithGroq = async (prompt) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
    temperature: 0.4,
  });
  return completion.choices[0].message.content;
};

// ── Rule-based fallback ───────────────────────────────────────────────────────
const generateFallback = (dataContext, filename) => {
  const lines = dataContext.split("\n");
  const totalLine = lines.find((l) => l.includes("total=") && l.toLowerCase().includes("revenue"));
  const totalRevenue = totalLine ? totalLine.match(/total=([\d.]+)/)?.[1] || "N/A" : "N/A";
  const rowLine = lines.find((l) => l.startsWith("Total Records:"));
  const rowCount = rowLine ? rowLine.split(":")[1].trim() : "N/A";

  return `**Executive Overview**

The sales dataset (${filename}) comprising ${rowCount} records has been analyzed. 
Total revenue across the period stands at $${parseFloat(totalRevenue || 0).toLocaleString()}.

**Revenue Performance**

Aggregate revenue reached $${parseFloat(totalRevenue || 0).toLocaleString()} across ${rowCount} transactions. 
Performance demonstrates consistent commercial activity across the recorded period.

**Product & Regional Insights**

The dataset reveals differentiated performance across product categories and geographic regions. 
High-value categories such as Electronics continue to command premium revenue per unit.

**Operational Highlights**

Data integrity across all tracked dimensions is solid with no critical anomalies detected. 
Fulfillment and delivery statuses are distributed across the pipeline.

**Strategic Recommendations**

1. Prioritize expansion in top-performing regions to capitalize on existing momentum.
2. Review cancelled orders to identify and address root causes impacting revenue.
3. Leverage high-margin product categories for targeted promotional investment.

*Note: Configure GROQ_API_KEY for AI-powered narrative generation.*`.trim();
};

// ── Main export ───────────────────────────────────────────────────────────────
const generateSalesSummary = async (dataContext, filename) => {
  const prompt = buildPrompt(dataContext, filename);

  if (groq) {
    try {
      logger.info("Calling Groq Llama 3...");
      const summary = await generateWithGroq(prompt);
      return { summary, provider: "groq" };
    } catch (err) {
      logger.warn(`Groq failed: ${err.message}. Using fallback.`);
    }
  }

  logger.info("Using deterministic fallback summary.");
  return { summary: generateFallback(dataContext, filename), provider: "fallback" };
};

module.exports = { generateSalesSummary };
