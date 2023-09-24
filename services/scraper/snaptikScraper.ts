import { chromium, Page } from "@playwright/test";

export const snaptikScrapper = async (videoUrl: string) => {
  const browser = await chromium.launch({
    headless: false,
  });

  const page: Page = await browser.newPage();

  await page.goto("https://snaptik.app/");

  const snaptikDownloadInput = page
    .getByPlaceholder("Paste TikTok link here")
    .first();
  console.log("Download Video Input", snaptikDownloadInput);

  await snaptikDownloadInput.click({ delay: 1000 });
  snaptikDownloadInput.fill(videoUrl);

  const downloadButton = page
    .locator(
      'button, input[type="button"], input[type="submit"] >> text="Download"',
    )
    .first();
  console.log("download button", downloadButton);

  await downloadButton.click({
    delay: 2000,
  });

  const downloadHQButton = page
    .locator('button > span >> text="Download HD"')
    .first();
  console.log("DOWNLOAD HQ BUTTON", downloadHQButton);
  downloadHQButton.click({
    delay: 2000,
  });
  // Extract the title
  const title = await page.title();
  console.log(`Title: ${title}`);

  // await browser.close();
};

snaptikScrapper(
  "https://www.tiktok.com/@misodope/video/7282031354223709486?utm_campaign=tt4d_open_api&utm_source=awx2oafttrk34dc9",
);
