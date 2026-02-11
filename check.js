const puppeteer = require("puppeteer");
const sharp = require("sharp");
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
    await page.goto(url, { waitUntil: "networkidle2" });

    const screenshotPath = "full.png";
    const croppedPath = "cropped.png";

    // แคปเต็มหน้า
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    await browser.close();

    // อ่าน metadata
    const image = sharp(screenshotPath);
    const metadata = await image.metadata();

    console.log("Original size:", metadata.width, "x", metadata.height);

    const cropRight = 300;   // ปรับได้
    const cropBottom = 200;  // ปรับได้

    const newWidth = metadata.width - cropRight;
    const newHeight = metadata.height - cropBottom;

    if (newWidth <= 0 || newHeight <= 0) {
      throw new Error("Crop size invalid!");
    }

    await image
      .extract({
        left: 0,
        top: 0,
        width: newWidth,
        height: newHeight,
      })
      .toFile(croppedPath);

    const croppedMeta = await sharp(croppedPath).metadata();
    console.log("Cropped size:", croppedMeta.width, "x", croppedMeta.height);

    // ส่ง Telegram
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("photo", fs.createReadStream(croppedPath));

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
