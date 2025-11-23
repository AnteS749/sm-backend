// scraper.js
const puppeteer = require("puppeteer");

const VUMEDI_EMAIL = process.env.VUMEDI_EMAIL;
const VUMEDI_PASSWORD = process.env.VUMEDI_PASSWORD;

const LOGIN_URL = "https://www.vumedi.com/admin/login/";

if (!VUMEDI_EMAIL || !VUMEDI_PASSWORD) {
  console.warn("VUMEDI_EMAIL ili VUMEDI_PASSWORD nisu postavljeni u environment varijablama");
}

/**
 * Uđe u VuMedi admin, ode na URL od Read transcript
 * i vrati tekst cijelog transkripta.
 *
 * @param {string} transcriptUrl - npr. https://www.vumedi.com/admin/transcription/view/24209/
 * @returns {Promise<string>}
 */
async function fetchTranscript(transcriptUrl) {
  if (!VUMEDI_EMAIL || !VUMEDI_PASSWORD) {
    throw new Error("Nedostaju VuMedi admin kredencijali u environmentu");
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  try {
    // 1. Login u admin
    await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

    // Ovdje pretpostavljamo Django admin sa poljima "username" i "password"
    // Ako ti se razlikuju selektori, promijeni ih prema HTML-u login forme
    await page.type('input[name="username"]', VUMEDI_EMAIL, { delay: 20 });
    await page.type('input[name="password"]', VUMEDI_PASSWORD, { delay: 20 });

    await Promise.all([
      page.click('input[type="submit"], button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    // 2. Otvori Read transcript URL
    await page.goto(transcriptUrl, { waitUntil: "networkidle2" });

    // 3. Uzmi sav tekst sa stranice
    const transcript = await page.evaluate(() => {
      // ako želiš samo određeni dio, ovdje možeš ciljati specificni element
      return document.body.innerText.trim();
    });

    if (!transcript || transcript.length === 0) {
      throw new Error("Transkript je prazan ili nije pronađen na stranici");
    }

    return transcript;
  } catch (err) {
    console.error("Greška u fetchTranscript:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = { fetchTranscript };
