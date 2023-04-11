import { chromium, Page } from "@playwright/test";

const scraper = async (url = "https://misodope.com") => {
  const browser = await chromium.launch({
    headless: false,
  });
  const page: Page = await browser.newPage();

  await page.goto(url);

  // Extract the links from the page using the CSS selector
  const links = await page.$$eval(
    "div > .transition-colors.duration-500",
    (els) =>
      els.map((el) => {
        return el.getAttribute("href");
      })
  );

  // Navigate to the last link
  await page.goto(links[links.length - 1]);
  // Extract the title
  const title = await page.title();

  console.log(`Links`, links);
  console.log(`Title: ${title}`);

  await browser.close();
};
scraper();
export default scraper;
