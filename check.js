const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://wifi.krufluke.com/', {
    waitUntil: 'networkidle'
  });

  // 🔹 กรอกเลขบัตร 13 หลัก
  await page.fill('input', '1234567890123');
  // ถ้ามีหลาย input ให้เปลี่ยนเป็น '#idcard' หรือ 'input[name="idcard"]'

  // 🔹 กดปุ่มค้นหา
  await page.click('button:has-text("ค้นหา")');

  // 🔹 รอผลลัพธ์โหลด
  await page.waitForTimeout(3000);

  // 🔹 ดึงข้อความทั้งหน้า (กรณีไม่รู้ id ผลลัพธ์)
  const content = await page.textContent('body');

  console.log('ผลลัพธ์ทั้งหมด:\n', content);

  // 🔹 ตัวอย่างตรวจเงื่อนไข
  if (content.includes('รหัส WiFi')) {
    console.log('✅ พบข้อมูล WiFi');
  } else if (content.includes('ไม่พบ')) {
    console.log('❌ ไม่พบข้อมูล');
  }

  await browser.close();
})();
