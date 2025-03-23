import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeWellfoundJobs() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        args: [
            '--window-size=1920,1080',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-notifications',
            '--disable-dev-shm-usage'
        ]
    });

    let allJobs = [];
    try {
        const page = await browser.newPage();
        
        // Add stealth measures
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        });

        // Set a more realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        // Enable JavaScript and cookies
        await page.setJavaScriptEnabled(true);
        
        // Add random delays between actions
        const randomDelay = () => new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 3000));

        // Navigate with retry logic
        let retries = 3;
        while (retries > 0) {
            try {
                await page.goto('https://wellfound.com/remote', {
                    waitUntil: 'networkidle2',
                    timeout: 60000
                });
                break;
            } catch (e) {
                console.log(`Retry ${4-retries} failed:`, e.message);
                retries--;
                if (retries === 0) throw e;
                await randomDelay();
            }
        }

        // Simulate human-like scrolling
        await autoScroll(page);
        
        // Wait for job listings with retry
        await page.waitForSelector('.styles_component__sMuDw', { 
            timeout: 30000,
            visible: true 
        });

        // Function to extract jobs from current page
        const extractJobs = async () => {
            await randomDelay(); // Add delay before extraction
            return await page.evaluate(() => {
                const jobs = [];
                const jobCards = document.querySelectorAll('.mb-4.w-full');

                jobCards.forEach(card => {
                    try {
                        const titleElement = card.querySelector('a[class*="text-sm font-semibold"]');
                        const companyElement = card.querySelector('h2.inline.text-md.font-semibold');
                        const salaryElement = card.querySelector('span[class*="pl-1 text-xs"]');
                        const locationElement = card.querySelector('svg[viewBox="0 0 13 14"]')?.closest('div')?.querySelector('span');
                        const postedDateElement = card.querySelector('span[class*="text-xs lowercase text-dark-a"]');
                        const companyDescElement = card.querySelector('span[class*="text-xs text-neutral-1000"]');
                        const companyLogoElement = card.querySelector('img[class*="rounded-2xl object-contain"]');
                        const employeeSizeElement = card.querySelector('span[class*="text-xs italic text-neutral-500"]');

                        const job = {
                            title: titleElement?.textContent?.trim() || '',
                            company: companyElement?.textContent?.trim() || '',
                            salary: salaryElement?.textContent?.trim() || '',
                            location: locationElement?.textContent?.trim() || '',
                            description: companyDescElement?.textContent?.trim() || '',
                            postedDate: postedDateElement?.textContent?.trim() || '',
                            companyLogo: companyLogoElement?.src || '',
                            applyLink: titleElement?.href || '',
                            employeeSize: employeeSizeElement?.textContent?.trim() || '',
                            source: 'Wellfound'
                        };
                        jobs.push(job);
                    } catch (e) {
                        console.error('Error parsing job card:', e);
                    }
                });
                return jobs;
            });
        };

        let pageNum = 1;
        const maxPages = 10;

        while (pageNum <= maxPages) {
            console.log(`Scraping page ${pageNum}...`);
            await randomDelay();

            const pageJobs = await extractJobs();
            allJobs.push(...pageJobs);
            console.log(`Found ${pageJobs.length} jobs on page ${pageNum}`);

            // Modified pagination handling
            try {
                const nextButton = await page.$('button[aria-label="Next"]');
                if (!nextButton || !await isElementVisible(page, nextButton)) break;
                
                await randomDelay();
                await nextButton.evaluate(b => b.click());
                await page.waitForSelector('.styles_component__sMuDw', { 
                    timeout: 30000,
                    visible: true 
                });
                await autoScroll(page); // Scroll after page change
                
                pageNum++;
            } catch (e) {
                console.log('No more pages to scrape');
                break;
            }
        }

        // Save results
        const result = {
            total_jobs: allJobs.length,
            last_updated: new Date().toISOString(),
            jobs: allJobs
        };

        fs.writeFileSync('wellfound_jobs.json', JSON.stringify(result, null, 2));
        console.log(`Successfully scraped ${allJobs.length} jobs and saved to wellfound_jobs.json`);

    } catch (error) {
        console.error('Error during scraping:', error.message);
    } finally {
        await browser.close();
    }
}

// Helper functions
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.documentElement.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100 + Math.random() * 200); // Random scroll speed
        });
    });
}

async function isElementVisible(page, element) {
    return await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }, element);
}

// Run the scraper
scrapeWellfoundJobs(); 