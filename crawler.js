// crawler.js
const puppeteer = require("puppeteer-core");
const chromium = require("chromium");

async function findTranscriptIdByTitle(title, email, password) {
  const browser = await puppeteer.launch({
    executablePath: chromium.path,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  const page = await browser.newPage();

  try {
    // LOGIN
    await page.goto("https://www.vumedi.com/admin/login/", { waitUntil: "networkidle2" });
    await page.type('input[name="username"]', email);
    await page.type('input[name="password"]', password);

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    // LISTING PAGE
    await page.goto("https://www.vumedi.com/admin/transcription/awstranscript/", {
      waitUntil: "networkidle2"
    });

    // UZMI SVE NASLOVE I ID-eve
    const items = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("tr")];
      return rows.map(row => {
        const titleNode = row.querySelector("th a");
        if (!titleNode) return null;

        const title = titleNode.innerText.trim();
        const href = titleNode.getAttribute("href"); 
        // format: /admin/transcription/awstranscript/24209/change/
        const parts = href.split("/").filter(Boolean);
        const id = parts[parts.length - 2]; // 24209

        return { title, id };
      }).filter(Boolean);
    });

    // NAĐI NAJBLIŽI MATCH — case insensitive
    title = title.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const item of items) {
      const score = similarity(title, item.title.toLowerCase());
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    return bestMatch ? bestMatch.id : null;

  } finally {
    await browser.close();
  }
}


// jednostavna fuzzy funkcija
function similarity(a, b) {
  let matches = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / len;
}

module.exports = { findTranscriptIdByTitle };
