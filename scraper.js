// scraper.js
const puppeteer = require("puppeteer-core");
const chromium = require("chromium");

async function fetchTranscript(id) {
  const viewUrl = `https://www.vumedi.com/transcription/view/${id}/`;

  const browser = await puppeteer.launch({
    executablePath: chromium.path,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  const page = await browser.newPage();

  await page.goto(viewUrl, { waitUntil: "networkidle2" });

  const transcript = await page.evaluate(() => {
    return document.body.innerText.trim();
  });

  await browser.close();
  return transcript;
}

module.exports = { fetchTranscript };
