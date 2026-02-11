const puppeteer = require("puppeteer");
const fs = require("fs");
const FormData = require("form-data");

(async () => {
  try {
    console.log("🚀 เริ่มทำงาน...");

    const url = process.env.TARGET_URL;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    console.log("🌐 URL:", url);
    console.log("Sending to chat_id:", chatId);
    console.log("Bot token:", botToken ? botToken.slice(0, 10) + "..." : "undefined");

    if (!url || !botToken || !chatId) {
      throw new Error("❌ TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID หรือ TARGET_URL ไม่ถูกตั้งค่า");
    }

    // เปิด browser
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log("⏳ กำลังเปิดเว็บ...");
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await page.waitForTimeout(5000); // รอโหลดกราฟ

    console.log("📸 กำลังแคปภาพ...");
    await page.screenshot({
      path: "screenshot.png",
      fullPage: true
    });

    await browser.close();

    console.log("📨 กำลังส่งเข้า Telegram...");

    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("photo", fs.createReadStream("screenshot.png"));

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: form
      }
    );

    const result = await response.json();
    console.log("📨 Telegram response:", result);

    if (!result.ok) {
      throw new Error("❌ Telegram ส่งไม่สำเร็จ");
    }

    console.log("✅ ส่งภาพเข้า Telegram สำเร็จ");

  } catch (error) {
    console.error("🔥 ERROR:", error);
    process.exit(1);
  }
})();
