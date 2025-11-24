// scraper.js
const puppeteer = require("puppeteer-core");
const chromium = require("chromium");

const VUMEDI_EMAIL = process.env.VUMEDI_EMAIL;
const VUMEDI_PASSWORD = process.env.VUMEDI_PASSWORD;

const LOGIN_URL = "https://www.vumedi.com/admin/login/";
const TPM_LIST_URL =
  "https://www.vumedi.com/admin/transcription/tpmtranscript/";

/**
 * Login u VuMedi admin i vrati otvoren page.
 */
async function loginToAdmin(browser) {
  const page = await browser.newPage();
  await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

  await page.type('input[name="username"]', VUMEDI_EMAIL);
  await page.type('input[name="password"]', VUMEDI_PASSWORD);

  await Promise.all([
    page.click('input[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle2" })
  ]);

  return page;
}

/**
 * Na TPM listing stranici nađi transkript po naslovu.
 * Koristi Django admin search (?q=title) i tablicu iz screenshota.
 * Vraća ID (npr. "56855") ili null.
 */
async function findTpmIdByTitle(page, title) {
  const searchUrl = `${TPM_LIST_URL}?q=${encodeURIComponent(title)}`;
  await page.goto(searchUrl, { waitUntil: "networkidle2" });

  const items = await page.evaluate(() => {
    const rows = Array.from(
      document.querySelectorAll("table#result_list tbody tr")
    );

    return rows
      .map(row => {
        const link = row.querySelector("th.field-video a");
        if (!link) return null;

        const titleText = link.innerText.trim();
        const href = link.getAttribute("href"); // /admin/transcription/tpmtranscript/56855/change/
        if (!href) return null;

        const parts = href.split("/").filter(Boolean);
        const id = parts[parts.length - 2]; // 56855

        return { id, title: titleText };
      })
      .filter(Boolean);
  });

  if (!items.length) return null;

  // najjednostavnije: uzmi prvi rezultat (Django admin već sortira po relevantnosti)
  return items[0].id;
}

/**
 * Za zadani naslov TPM transkripta vrati puni tekst transkripta.
 */
async function fetchTpmTranscriptByTitle(title) {
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

  try {
    const page = await loginToAdmin(browser);

    const id = await findTpmIdByTitle(page, title);
    if (!id) {
      throw new Error(
        `No TPM transcript found for title: "${title}"`
      );
    }

    const viewUrl = `https://www.vumedi.com/transcription/tpm/view/${id}/`;
    await page.goto(viewUrl, { waitUntil: "networkidle2" });

    const transcript = await page.evaluate(() => {
      return document.body.innerText.trim();
    });

    if (!transcript) {
      throw new Error("Transcript page is empty");
    }

    return { id, transcript };
  } finally {
    await browser.close();
  }
}

module.exports = { fetchTpmTranscriptByTitle };
