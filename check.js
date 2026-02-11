const puppeteer = require("puppeteer");
const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");

(async () => {
  try {
    console.log("🚀 เริ่มทำงาน...");

    const url = "http://915109c1f865.sn.mynetname.net:36130/graphs/iface/bridge%2Dlan/";
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    console.log("🌐 URL:", url);
    console.log("💬 Chat ID:", chatId);

    // ✅ บรรทัดที่เพิ่มตามที่ขอ
    console.log("Sending to chat_id:", chatId);
    console.log("Bot token:", process.env.TELEGRAM_BOT_TOKEN?.slice(0, 10));

    if (!url || !botToken || !chatId) {
      throw new Error("❌ Environment variable ไม่ครบ");
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log("⏳ กำลังเปิดเว็บ...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForTimeout(5000);

    console.log("📸 กำลังแคปภาพ...");

    await page.screenshot({
      path: "screenshot.png",
      clip: {
        x: 0,
        y: 0,
        width: 1280,
        height: 600
      }
    });

    await browser.close();

    console.log("📨 กำลังส่งเข้า Telegram...");

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", fs.createReadStream("screenshot.png"));

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: formData
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
