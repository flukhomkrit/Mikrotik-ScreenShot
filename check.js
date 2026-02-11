const { chromium } = require('playwright');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'http://915109c1f865.sn.mynetname.net:36130/graphs/iface/bridge-lan/';

  // เปิดเว็บ
  await page.goto(url, { waitUntil: 'networkidle' });

  // รอโหลดเพิ่ม (กันพลาดเว็บช้า)
  await page.waitForTimeout(3000);

  // แคปทั้งหน้า
  await page.screenshot({
    path: 'screenshot.png',
    fullPage: true
  });

  await browser.close();

  // เตรียมส่งเข้า Telegram
  const form = new FormData();
  form.append('chat_id', process.env.TELEGRAM_CHAT_ID);
  form.append('caption', `📸 Screenshot จาก:\n${url}`);
  form.append('photo', fs.createReadStream('screenshot.png'));

  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
    {
      method: 'POST',
      body: form
    }
  );

  console.log('✅ ส่งภาพเข้า Telegram สำเร็จ');
})();

