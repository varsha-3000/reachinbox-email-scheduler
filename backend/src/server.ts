import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { checkDatabaseConnection } from "./config/database.js";
import { checkElasticsearchConnection } from "./config/elasticsearch.js";
import emailRoutes from "./routes/email.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "reachinbox-backend"
  });
});

app.use("/api/emails", emailRoutes);

const port = Number(process.env.PORT) || 4000;

async function startServer() {
  try {
    await checkDatabaseConnection();

    try {
      await checkElasticsearchConnection();
      console.log("Elasticsearch connected successfully");
    } catch {
      console.warn(
        "Elasticsearch is unavailable. Backend will continue without search indexing."
      );
    }

    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();