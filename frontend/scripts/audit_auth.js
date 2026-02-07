import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    const port = 9222; // Remote debugging port
    const browser = await puppeteer.launch({
        args: [`--remote-debugging-port=${port}`],
        headless: "new"
    });

    // Login flow
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173/admin/login');
    } catch (e) {
        console.log('Failed to load page, trying again...');
        await page.goto('http://localhost:5173/admin/login');
    }

    console.log('Logging in...');
    await page.waitForSelector('input[placeholder="Enter your username"]');
    await page.type('input[placeholder="Enter your username"]', 'john');
    await page.type('input[placeholder="Enter your password"]', 'john123');
    await page.click('button.btn-primary');

    // Wait for dashboard or users page to load
    try {
        await page.waitForSelector('main', { timeout: 60000 });
        console.log('Logged in. Current URL:', page.url());
    } catch (e) {
        console.error('Timeout waiting for dashboard/main content');
        console.log('Current URL:', page.url());
        // Take screenshot if possible, or just log
    }

    if (!page.url().includes('/admin')) {
        console.error('Login failed or redirected unexpectedly.');
        // await browser.close();
        // process.exit(1);
    }

    // Run Lighthouse
    console.log('Running Lighthouse audit on /admin/users...');
    const result = await lighthouse('http://localhost:5173/admin/users', {
        port: port,
        output: 'json',
        logLevel: 'info',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'desktop',
        screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
        },
    });

    console.log('Lighthouse finished.');
    const report = result.report;
    const score = result.lhr.categories.performance.score * 100;

    console.log(`Performance Score: ${score}`);

    // Save report
    const reportPath = path.join(__dirname, 'lighthouse-report.json');
    fs.writeFileSync(reportPath, report);
    console.log(`Report saved to ${reportPath}`);

    await browser.close();
})();
