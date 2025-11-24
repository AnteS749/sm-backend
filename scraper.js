// scraper.js
const puppeteer = require("puppeteer-core");
const chromium = require("chromium");

const VUMEDI_EMAIL = process.env.VUMEDI_EMAIL;
const VUMEDI_PASSWORD = process.env.VUMEDI_PASSWORD;

const LOGIN_URL = "https://www.vumedi.com/admin/login/";
const TPM_LIST_URL =
  "https://www.vumedi.com/admin/transcription/tpmtranscript/";

// helper for fuzzy match
function similarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  let matches = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / len;
}

async function loginToAdmin(browser) {
  const page = await browser.newPage();

  await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

  await page.type('input[name="username"]', VUMEDI_EMAIL);
  await page.type('input[name="password"]', VUMEDI_PASSWORD);

  await Promise.all([
    page.click('input[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle2" }),
  ]);

  return page;
}

async function fetchTpmTranscriptByTitle(title) {
  const browser = await puppeteer.launch({
    executablePath: chromium.path,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await loginToAdmin(browser);

    // Open first page of listing
    await page.goto(TPM_LIST_URL, { waitUntil: "networkidle2" });

    // Scrape ALL titles from first page
    const items = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("table#result_list tbody tr")
      ).map(row => {
        const link = row.querySelector("th.field-video a");
        if (!link) return null;

        const title = link.innerText.trim();
        const href = link.getAttribute("href");

        const parts = href.split("/").filter(Boolean);
        const id = parts[parts.length - 2];

        return { id, title };
      }).filter(Boolean);
    });

    if (!items.length) {
      throw new Error("TPM listing did not return any items");
    }

    // Fuzzy match
    let best = null;
    let bestScore = 0;

    for (const item of items) {
      const score = similarity(item.title, title);
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }

    if (!best) throw new Error("No TPM transcript found matching title");
    const transcriptUrl = `https://www.vumedi.com/transcription/tpm/view/${best.id}/`;

    // Open transcript page
    await page.goto(transcriptUrl, { waitUntil: "networkidle2" });

    const transcript = await page.evaluate(() => {
      return document.body.innerText.trim();
    });

    return { id: best.id, title: best.title, transcript };

  } finally {
    await browser.close();
  }
}

module.exports = { fetchTpmTranscriptByTitle };
