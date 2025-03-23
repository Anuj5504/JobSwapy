import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeIndeedJobs() {
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

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        await page.setJavaScriptEnabled(true);
        
        const randomDelay = () => new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 3000));

        // Navigate with retry logic
        let retries = 3;
        while (retries > 0) {
            try {
                await page.goto('https://www.indeed.com/jobs?q=software+developer&l=remote', {
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

        await autoScroll(page);
        
        await page.waitForSelector('.job_seen_beacon', { 
            timeout: 30000,
            visible: true 
        });

        const extractJobs = async () => {
            await randomDelay();
            return await page.evaluate(() => {
                const jobs = [];
                const jobCards = document.querySelectorAll('.job_seen_beacon');

                jobCards.forEach(card => {
                    try {
                        const titleElement = card.querySelector('.jobTitle span');
                        const companyElement = card.querySelector('[data-testid="company-name"]');
                        const salaryElement = card.querySelector('.metadata.salary-snippet-container');
                        const locationElement = card.querySelector('[data-testid="text-location"]');
                        const descriptionElement = card.querySelector('[data-testid="jobsnippet_footer"]');
                        const postedDateElement = card.querySelector('[data-testid="myJobsStateDate"]');
                        const applyLinkElement = card.querySelector('.jobTitle a');

                        const job = {
                            title: titleElement?.textContent?.trim() || '',
                            company: companyElement?.textContent?.trim() || '',
                            salary: salaryElement?.textContent?.trim() || '',
                            location: locationElement?.textContent?.trim() || '',
                            description: descriptionElement?.textContent?.trim() || '',
                            postedDate: postedDateElement?.textContent?.trim() || '',
                            applyLink: applyLinkElement?.href || '',
                            source: 'Indeed'
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

            try {
                const nextButton = await page.$('[data-testid="pagination-page-next"]');
                if (!nextButton || !await isElementVisible(page, nextButton)) break;
                
                await randomDelay();
                await nextButton.evaluate(b => b.click());
                await page.waitForSelector('.job_seen_beacon', { 
                    timeout: 30000,
                    visible: true 
                });
                await autoScroll(page);
                
                pageNum++;
            } catch (e) {
                console.log('No more pages to scrape');
                break;
            }
        }

        const result = {
            total_jobs: allJobs.length,
            last_updated: new Date().toISOString(),
            jobs: allJobs
        };

        fs.writeFileSync('indeed_jobs.json', JSON.stringify(result, null, 2));
        console.log(`Successfully scraped ${allJobs.length} jobs and saved to indeed_jobs.json`);

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
            }, 100 + Math.random() * 200);
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
scrapeIndeedJobs(); 