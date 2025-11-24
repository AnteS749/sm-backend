// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { fetchTpmTranscriptByTitle } = require("./scraper");

const app = express();

const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

app.use(express.json());
app.use(
  cors({
    origin: ALLOWED_ORIGIN === "*" ? true : ALLOWED_ORIGIN
  })
);

// health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "sm-backend radi" });
});

/**
 * Glavni endpoint koji GPT zove:
 * Body: { "title": "Time Management Tips to Help Primary Care Doctors Maximize Productivity" }
 */
app.post("/searchTpmTranscript", async (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== "string") {
    return res.status(400).json({
      error: "Nedostaje ili je neispravan 'title' u request body"
    });
  }

  try {
    const { id, transcript } = await fetchTpmTranscriptByTitle(title);
    return res.json({ id, transcript });
  } catch (err) {
    console.error("API error /searchTpmTranscript:", err);
    return res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`sm-backend sluša na portu ${PORT}`);
});
