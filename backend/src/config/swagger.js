const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sales Insight Automator API",
      version: "1.0.0",
      description: `
## Rabbitt AI — Sales Insight Automator

A secure Node.js/Express API that ingests CSV/Excel sales data,
generates AI-powered executive summaries, and delivers them via email.

### Flow
1. **Upload** a \`.csv\` or \`.xlsx\` file with a recipient email
2. **AI Engine** (Groq/Llama 3) parses the data and writes an executive brief
3. **Email** is dispatched via Nodemailer (SMTP or SendGrid)
4. **Response** returns a summary preview instantly

### Security
- Helmet HTTP headers (XSS, clickjacking, MIME sniffing)
- Rate limiting (10 req/min per IP)
- NoSQL injection sanitization
- XSS payload stripping
- Optional API key authentication
      `,
      contact: {
        name: "Rabbitt AI Engineering",
        email: "engineering@rabbitt.ai",
      },
      license: { name: "MIT" },
    },
    servers: [
      {
        url: "https://sales-insight-automator-2fjh.onrender.com",
        description: "Production (Render)",
      },
      {
        url: process.env.API_BASE_URL || "http://localhost:5000",
        description: "Local / Development",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "Optional. Set API_KEY env var to enable.",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
