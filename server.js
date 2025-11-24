// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { fetchTranscript } = require("./scraper");
const { findTranscriptIdByTitle } = require("./crawler");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.post("/searchTranscript", async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "missing title" });
  }

  try {
    const id = await findTranscriptIdByTitle(
      title,
      process.env.VUMEDI_EMAIL,
      process.env.VUMEDI_PASSWORD
    );

    if (!id) {
      return res.status(404).json({ error: "No matching transcript found" });
    }

    const transcript = await fetchTranscript(id);
    return res.json({ id, transcript });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

app.listen(10000, () => console.log("sm-backend running on 10000"));
