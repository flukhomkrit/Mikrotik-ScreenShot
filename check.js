const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

(async () => {
  try {
    const url = process.env.TARGET_URL;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    console.log("Sending to chat_id:", chatId);
    console.log("Bot token:", botToken?.slice(0, 10));
    console.log("Opening URL:", url);

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // ตั้ง viewport ชัด ๆ
    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    await page.goto(url, { waitUntil: "networkidle2" });

    // ดึงขนาดหน้าเว็บจริง
    const bodySize = await page.evaluate(() => {
      return {
        width: document.body.scrollWidth,
        height: document.body.scrollHeight,
      };
    });

    console.log("Full page size:", bodySize.width, "x", bodySize.height);

    // 🔥 ปรับค่าตรงนี้
    const cropRight = 300;   // ตัดด้านขวา
    const cropBottom = 200;  // ตัดด้านล่าง

    const clipWidth = bodySize.width - cropRight;
    const clipHeight = bodySize.height - cropBottom;

    console.log("Clip size:", clipWidth, "x", clipHeight);

    const screenshotPath = "cropped.png";

    await page.screenshot({
      path: screenshotPath,
      clip: {
        x: 0,
        y: 0,
        width: clipWidth,
        height: clipHeight,
      },
    });

    await browser.close();

    // ส่ง Telegram
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("photo", fs.createReadStream(screenshotPath));

    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      form,
      { headers: form.getHeaders() }
    );

    console.log("Sent successfully!");
  } catch (err) {
    console.error("ERROR:", err);
  }
})();
