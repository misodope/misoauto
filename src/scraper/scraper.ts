import { chromium, Page } from "@playwright/test";
import process from "process";

const args = process.argv;
const url = args[2];
const selector = args[3];

const scraper = async (scrapeUrl = url, scrapeSelector = selector) => {
  const browser = await chromium.launch({
    headless: false,
  });

  const page: Page = await browser.newPage();

  await page.goto(scrapeUrl);

  const scraped = await page.locator(scrapeSelector).all();
  // get all inner text from scraped
  const scrapedText = await Promise.all(
    scraped.map(async (el) => await el.getAttribute("href")),
  );

  // Extract the title
  const title = await page.title();
  console.log("Scraped", scrapedText);
  console.log(`Title: ${title}`);

  await browser.close();
};
scraper();
export default scraper;
