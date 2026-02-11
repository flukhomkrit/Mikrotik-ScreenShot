const { chromium } = require('playwright');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');
const fs = require('fs');

(async () => {
  try {
    console.log("🚀 เริ่มทำงาน...");

    const url = "http://915109c1f865.sn.mynetname.net:36130/graphs/iface/bridge%2Dlan/";

    // ตรวจสอบ secret
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      throw new Error("❌ TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID ไม่ถูกตั้งค่า");
    }

    const browser = await chromium.launch({ headless: true });

    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 }
    });

    console.log("🌐 เปิดเว็บ:", url);

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 60000
    });

    // รอโหลดเพิ่มเล็กน้อย
    await page.waitForTimeout(3000);

    // 🔽 เลือกแบบที่ต้องการ

    // ✅ แบบที่ 1: แคปทั้งหน้า
    await page.screenshot({
      path: "screenshot.png",
      fullPage: true
    });

    /*
    // ✅ แบบที่ 2: แคปเฉพาะ element (ถ้ารู้ selector)
    const element = await page.locator('img'); 
    await element.first().screenshot({ path: "screenshot.png" });
    */

    await browser.close();

    console.log("📸 แคปหน้าจอเสร็จแล้ว");

    // ส่งเข้า Telegram
    const form = new FormData();
    form.append("chat_id", process.env.TELEGRAM_CHAT_ID);
    form.append("caption", `📊 Network Graph\n${url}\n\n🕒 ${new Date().toLocaleString()}`);
    form.append("photo", fs.createReadStream("screenshot.png"));

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: form
      }
    );

    const result = await response.text();
    console.log("📨 Telegram response:", result);

    console.log("✅ ส่งภาพเข้า Telegram สำเร็จ");

  } catch (error) {
    console.error("🔥 ERROR:", error);

    // ถ้าเกิด error ส่งแจ้งเตือนข้อความแทน
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: "❌ GitHub Action เกิดข้อผิดพลาด:\n" + error.message
          })
        }
      );
    }
  }
})();
