const puppeteer = require("puppeteer");
const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");

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

    // 📸 แคปเต็มหน้า
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    await browser.close();

    // 🪄 โหลดรูปมา crop
    const image = sharp(screenshotPath);
    const metadata = await image.metadata();

    const cropRight = 200;   // 👉 ปรับได้
    const cropBottom = 150;  // 👉 ปรับได้

    const newWidth = metadata.width - cropRight;
    const newHeight = metadata.height - cropBottom;

    await image
      .extract({
        left: 0,
        top: 0,
        width: newWidth,
        height: newHeight,
      })
      .toFile(croppedPath);

    console.log("Image cropped:", newWidth, "x", newHeight);

    // 📤 ส่งเข้า Telegram
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", fs.createReadStream(croppedPath));

    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    console.log("Sent to Telegram successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
})();
