// scraper.js
const puppeteer = require("puppeteer-core");
const chromium = require("chromium");

const VUMEDI_EMAIL = process.env.VUMEDI_EMAIL;
const VUMEDI_PASSWORD = process.env.VUMEDI_PASSWORD;

const LOGIN_URL = "https://www.vumedi.com/admin/login/";

async function fetchTranscript(transcriptUrl) {
  if (!VUMEDI_EMAIL || !VUMEDI_PASSWORD) {
    throw new Error("Missing VuMedi admin credentials");
  }

  const browser = await puppeteer.launch({
    executablePath: chromium.path,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  });

  const page = await browser.newPage();

  try {
    await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });
    await page.type('input[name="username"]', VUMEDI_EMAIL);
    await page.type('input[name="password"]', VUMEDI_PASSWORD);

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    await page.goto(transcriptUrl, { waitUntil: "networkidle2" });

    const transcript = await page.evaluate(() => {
      return document.body.innerText.trim();
    });

    return transcript;

  } catch (err) {
    console.error("Error in fetchTranscript:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = { fetchTranscript };
