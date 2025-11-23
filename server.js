// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { fetchTranscript } = require("./scraper");

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

// glavni endpoint koji će GPT zvati
app.post("/getTranscript", async (req, res) => {
  const { transcript_url } = req.body || {};

  if (!transcript_url || typeof transcript_url !== "string") {
    return res.status(400).json({
      error: "Nedostaje ili je neispravan 'transcript_url' u request body"
    });
  }

  try {
    const transcript = await fetchTranscript(transcript_url);
    return res.json({ transcript });
  } catch (err) {
    console.error("API error /getTranscript:", err);
    return res.status(500).json({
      error: "Nije uspjelo dohvatiti transkript: " + err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`sm-backend sluša na portu ${PORT}`);
});
