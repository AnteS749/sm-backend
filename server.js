app.post("/searchTpmTranscript", async (req, res) => {
  const { title } = req.body;

  if (!title) return res.status(400).json({ error: "missing title" });

  try {
    const result = await fetchTpmTranscriptByTitle(title);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
