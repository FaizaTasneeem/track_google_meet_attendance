import puppeteer from "puppeteer-extra";
import { executablePath } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from 'dotenv';

dotenv.config();
puppeteer.use(StealthPlugin());

const email = process.env.EMAIL_ID?.trim() || (() => { throw new Error('Missing EMAIL_ID'); })();
const password = process.env.PASSWORD?.trim() || (() => { throw new Error('Missing PASSWORD'); })();
let participants_list = [];


async function initiate_process() {
  const browser = await puppeteer.launch({
    executablePath: executablePath(),
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  
  const page = await browser.newPage();
  await page.goto("https://accounts.google.com/signin");
  
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', email);
  await page.click('#identifierNext');
  
  await page.waitForSelector('input[type="password"]', { visible: true });
  await page.type('input[type="password"]', password);
  await page.click('#passwordNext');
  
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
  return {browser, page}
}


async function retrieve_scrum_attendance(page) {
  await page.goto("https://meet.google.com/puq-cqat-vbx");
  console.log("Initiating process...");

  let participants_list = [];
  try {
    await select_button(page, '.nMIz8e', '.VfPpkd-dgl2Hf-ppHlrf-sM5MNb button.mUIrbf-LgbsSe.mUIrbf-LgbsSe-OWXEXe-dgl2Hf.mUIrbf-StrnGf-YYd4I-VtOx3e', 'span.mUIrbf-vQzf8d', 'Continue without microphone and camera');
    // sleep 5
    await new Promise(resolve => setTimeout(resolve, 5000));
    await select_button(page, '.XCoPyb', '.UywwFc-LgbsSe.UywwFc-LgbsSe-OWXEXe-SfQLQb-suEOdc.UywwFc-LgbsSe-OWXEXe-dgl2Hf.UywwFc-StrnGf-YYd4I-VtOx3e.tusd3.IyLmn.QJgqC', 'span.UywwFc-vQzf8d', 'Join now', 'Join anyway');
    // sleep 5
    await new Promise(resolve => setTimeout(resolve, 5000));
    await select_button(page, '.tMdQNe', '.VYBDae-Bz112c-LgbsSe.VYBDae-Bz112c-LgbsSe-OWXEXe-SfQLQb-suEOdc.hk9qKe.S5GDme.Ld74n.JsuyRc.boDUxc', 'i.quRWN-Bz112c', 'people');
  
    participants_list = await get_participants_names(page);
  }
  catch (error) {
    console.log('⚠️ Selector not found, reloading page...');
  }
  return participants_list;
}


async function select_button(page, wait_for_selector, button_classifier, other_div_classifier, log_msg1, log_msg2) {
  await page.waitForSelector(wait_for_selector, { visible: true }); 
  const buttons = await page.$$(button_classifier);

  for (const button of buttons) {
    const hasTargetText = await page.evaluate((el, other_div_classifier, log_msg1, log_msg2) => {
      const spans = el.querySelectorAll(other_div_classifier);
      for (const span of spans) {
        if (span.innerText?.trim() == log_msg1) {
          return true;
        }
        else if (log_msg2 && span.innerText?.trim() == log_msg2) {
          console.log(log_msg2);
          return true;
        }
      }
      return false;
    }, button, other_div_classifier, log_msg1, log_msg2);

    if (hasTargetText) {
      await button.click();
      console.log('✅ Clicked the "',log_msg1,'" button!');
      break;
    }
  }
}


async function get_participants_names(page) {
  await page.waitForSelector('.m3Uzve.RJRKn', { visible: true }); 
  const listItems = await page.$$('.m3Uzve.RJRKn [role="listitem"]');

  for (const item of listItems) {
    const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), item);
    return ariaLabel;
  }
}


while (participants_list.length == 0) {
  var {browser, page} = await initiate_process();
  participants_list = await retrieve_scrum_attendance(page);
}
console.log(participants_list);

await page.close();
await browser.close();
console.log("🎯 Finished session.");
process.exit(0);