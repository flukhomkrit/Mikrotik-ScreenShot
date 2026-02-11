const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

(async () => {
  try {
    const url = process.env.TARGET_URL;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    console.log("TARGET_URL:", url);
    console.log("Sending to chat_id:", chatId);
    console.log("Bot token:", botToken?.slice(0, 10));

    if (!url || !chatId || !botToken) {
      throw new Error("Missing environment variables");
    }

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1300, height: 720 });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await new Promise(resolve => setTimeout(resolve, 5000));


    const fullSize = await page.evaluate(() => {
      return {
        width: document.body.scrollWidth,
        height: document.body.scrollHeight,
      };
    });

    console.log("Full size:", fullSize);

    const cropWidth = fullSize.width - 300;   // ตัดขวา
    const cropHeight = fullSize.height - 0; // ตัดล่าง

    await page.screenshot({
      path: "cropped.png",
      clip: {
        x: 0,
        y: 0,
        width: cropWidth,
        height: cropHeight,
      },
    });

    await browser.close();

    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("photo", fs.createReadStream("cropped.png"));

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;

    await axios.post(telegramUrl, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });

    console.log("✅ Sent successfully");
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
})();
