import puppeteer from 'puppeteer';
import fs from 'fs';

const jobSites = [
    {
        name: 'Naukri',
        url: 'https://www.naukri.com/jobs-in-india-11?src=discovery_trendingWdgt_homepage_srch&functionAreaIdGid=1&functionAreaIdGid=2&functionAreaIdGid=3&functionAreaIdGid=4&functionAreaIdGid=5&functionAreaIdGid=6&functionAreaIdGid=7&functionAreaIdGid=8&functionAreaIdGid=9&functionAreaIdGid=10&functionAreaIdGid=11&functionAreaIdGid=12&functionAreaIdGid=13&functionAreaIdGid=14&functionAreaIdGid=15&functionAreaIdGid=16&functionAreaIdGid=18&functionAreaIdGid=19&functionAreaIdGid=20&functionAreaIdGid=21&functionAreaIdGid=24&functionAreaIdGid=25&functionAreaIdGid=26&functionAreaIdGid=27&functionAreaIdGid=28&functionAreaIdGid=29&functionAreaIdGid=30&functionAreaIdGid=35&functionAreaIdGid=36',
        selectors: {
            jobCard: 'article.jobTuple',
            title: 'a.title.fw500.ellipsis',
            company: 'a.subTitle.ellipsis.fleft',
            location: 'span[title="location"]',
            experience: 'li.experience',
            salary: 'li.salary',
            description: 'div.job-description',
            skills: 'ul.tags li',
            postedDate: 'span.fleft.postedDate',
            applyLink: 'a.title.fw500.ellipsis'
        },
        async preProcess(page) {
            try {
                // Wait for initial load
                await page.waitForSelector('div.search-result-container', { timeout: 30000 });
                
                // Handle login popup if it appears
                try {
                    const loginPopup = await page.$('#login_Layer');
                    if (loginPopup) {
                        await page.click('.cross-icon');
                    }
                } catch (e) {}

                // Wait for jobs to load
                await page.waitForSelector('article.jobTuple', { timeout: 30000 });
            } catch (e) {
                console.log('Naukri preprocess error:', e.message);
            }
        }
    },
    {
        name: 'Indeed',
        url: 'https://in.indeed.com/jobs?q=software+developer&l=Remote',
        selectors: {
            jobCard: 'div.job_seen_beacon',
            title: '[id^="jobTitle"]',
            company: 'span.companyName',
            location: 'div.companyLocation',
            salary: 'div.metadata.salary-snippet-container',
            description: 'div.job-snippet',
            postedDate: 'span.date',
            applyLink: 'a[id^="job_"]'
        },
        async preProcess(page) {
            try {
                // Wait for initial load
                await page.waitForSelector('div.jobsearch-ResultsList', { timeout: 30000 });
                
                // Close any popups
                try {
                    const popupClose = await page.$('#popover-x, .icl-CloseButton');
                    if (popupClose) {
                        await popupClose.click();
                    }
                } catch (e) {}

                // Wait for job cards
                await page.waitForSelector('div.job_seen_beacon', { timeout: 30000 });
            } catch (e) {
                console.log('Indeed preprocess error:', e.message);
            }
        }
    }
];

async function scrapeJobs() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-notifications',
            '--disable-dev-shm-usage'
        ]
    });
    let allJobs = [];

    try {
    for (const site of jobSites) {
            console.log(`Scraping ${site.name}...`);
            const page = await browser.newPage();

            // Set modern user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            try {
                // Navigate to the job site with retry mechanism
                let retryCount = 0;
                while (retryCount < 3) {
                    try {
                        await page.goto(site.url, { 
                            waitUntil: 'networkidle0',
                            timeout: 60000 
                        });
                        break;
                    } catch (e) {
                        console.log(`Retry ${retryCount + 1} for ${site.name}`);
                        retryCount++;
                        if (retryCount === 3) throw e;
                        await page.waitForTimeout(2000);
                    }
                }

                // Run site-specific pre-processing
                if (site.preProcess) {
                    await site.preProcess(page);
                }

                // Scroll with delay
                await autoScroll(page);

                // Extract jobs
                const jobs = await page.evaluate((selectors) => {
                    const jobElements = document.querySelectorAll(selectors.jobCard);
                    console.log(`Found ${jobElements.length} job elements`);
                    
                    return Array.from(jobElements).map(job => {
                        const getTextContent = (selector) => {
                            try {
                                const element = job.querySelector(selector);
                                return element ? element.textContent.trim() : '';
                            } catch (e) {
                                return '';
                            }
                        };

                        const getHref = (selector) => {
                            try {
                                const element = job.querySelector(selector);
                                return element ? element.href : '';
                            } catch (e) {
                                return '';
                            }
                        };

                        const getSkills = (selector) => {
                            try {
                                const elements = job.querySelectorAll(selector);
                                return Array.from(elements).map(el => el.textContent.trim());
                            } catch (e) {
                                return [];
                            }
                        };

                        return {
                            title: getTextContent(selectors.title),
                            company: getTextContent(selectors.company),
                            location: getTextContent(selectors.location),
                            salary: getTextContent(selectors.salary),
                            description: getTextContent(selectors.description),
                            experience: getTextContent(selectors.experience),
                            skills: getSkills(selectors.skills),
                            postedDate: getTextContent(selectors.postedDate),
                            applyLink: getHref(selectors.applyLink)
                        };
                    });
                }, site.selectors);

                // Add source and timestamp
                const jobsWithMetadata = jobs
                    .filter(job => job.title && job.company)
                    .map(job => ({
                        ...job,
                        source: site.name,
                        scraped_at: new Date().toISOString()
                    }));

                console.log(`Found ${jobsWithMetadata.length} valid jobs from ${site.name}`);
                allJobs.push(...jobsWithMetadata);

            } catch (error) {
                console.error(`Error scraping ${site.name}:`, error.message);
            } finally {
                await page.close();
            }
        }

        // Save to JSON file
        const result = {
            total_jobs: allJobs.length,
            last_updated: new Date().toISOString(),
            jobs: allJobs
        };

        fs.writeFileSync('jobs.json', JSON.stringify(result, null, 2));
        console.log(`Successfully scraped ${allJobs.length} jobs and saved to jobs.json`);

    } catch (error) {
        console.error('Error during scraping:', error.message);
    } finally {
        await browser.close();
    }
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            let attempts = 0;
            const maxAttempts = 30;

            const timer = setInterval(() => {
                const scrollHeight = document.documentElement.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                attempts++;

                // Add small random delay to appear more human-like
                const randomDelay = Math.floor(Math.random() * 100);
                setTimeout(() => {}, randomDelay);

                if (totalHeight >= scrollHeight || attempts >= maxAttempts) {
                    clearInterval(timer);
                    resolve();
                }
            }, 300); // Slower scroll
        });
    });
}

async function scrapeNaukriJobs() {
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
            '--disable-notifications'
        ]
    });

    let allJobs = [];
    try {
        const page = await browser.newPage();
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to Naukri
        await page.goto('https://www.naukri.com/internship-jobs?src=discovery_trendingWdgt_homepage_srch&industryTypeIdGid=109&industryTypeIdGid=110&functionAreaIdGid=5&glbl_qcrc=1026&glbl_qcrc=1027&glbl_qcrc=1028', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait for job listings to load
        await page.waitForSelector('.srp-jobtuple-wrapper', { timeout: 30000 });

        // Function to extract detailed job info
        const getDetailedJobInfo = async (jobLink) => {
            const newPage = await browser.newPage();
            try {
                await newPage.goto(jobLink, {
                    waitUntil: 'networkidle0',
                    timeout: 60000
                });

                await newPage.waitForSelector('.styles_job-desc-container__txpYf');

                const detailedInfo = await newPage.evaluate(() => {
                    // Helper function to get text after label
                    const getTextAfterLabel = (labelText) => {
                        const elements = Array.from(document.querySelectorAll('.styles_details__Y424J'));
                        const targetElement = elements.find(el => 
                            el.querySelector('label')?.textContent?.trim() === labelText
                        );
                        return targetElement?.querySelector('span')?.textContent?.trim() || '';
                    };

                    return {
                        fullDescription: document.querySelector('.styles_JDC__dang-inner-html__h0K4t')?.textContent?.trim() || '',
                        keySkills: Array.from(document.querySelectorAll('.styles_chip__7YCfG'))
                            .map(skill => skill.textContent.trim()),
                        roleDetails: {
                            role: getTextAfterLabel('Role: '),
                            industryType: getTextAfterLabel('Industry Type: '),
                            department: getTextAfterLabel('Department: '),
                            employmentType: getTextAfterLabel('Employment Type: '),
                            roleCategory: getTextAfterLabel('Role Category: ')
                        },
                        education: {
                            ug: getTextAfterLabel('UG: '),
                            pg: getTextAfterLabel('PG: ')
                        },
                        companyDetails: {
                            about: document.querySelector('.styles_detail__U2rw4')?.textContent?.trim() || '',
                            openings: document.querySelector('.styles_jhc__stat__PgY67')?.textContent?.match(/Openings:\s*(\d+)/)?.[1] || '',
                            applicants: document.querySelector('.styles_jhc__stat__PgY67')?.textContent?.match(/Applicants:\s*(\d+)/)?.[1] || '',
                            postedDate: document.querySelector('.styles_jhc__stat__PgY67')?.textContent?.match(/Posted:\s*([^,]+)/)?.[1] || ''
                        }
                    };
                });

                return detailedInfo;
            } catch (error) {
                console.error('Error getting detailed job info:', error.message);
                return null;
            } finally {
                await newPage.close();
            }
        };

        // Function to extract jobs from current page
        const extractJobs = async () => {
            const jobs = await page.evaluate(() => {
                const jobCards = document.querySelectorAll('.srp-jobtuple-wrapper');
                return Array.from(jobCards).map(card => ({
                    title: card.querySelector('.title')?.textContent?.trim() || '',
                    company: card.querySelector('.comp-name')?.textContent?.trim() || '',
                    experience: card.querySelector('.exp-wrap')?.textContent?.trim() || '',
                    salary: card.querySelector('.sal-wrap')?.textContent?.trim() || '',
                    location: card.querySelector('.loc-wrap')?.textContent?.trim() || '',
                    description: card.querySelector('.job-desc')?.textContent?.trim() || '',
                    skills: Array.from(card.querySelectorAll('.tags-gt li'))
                        .map(skill => skill.textContent.trim()),
                    postedDate: card.querySelector('.job-post-day')?.textContent?.trim() || '',
                    companyLogo: card.querySelector('.logoImage')?.src || '',
                    applyLink: card.querySelector('.title')?.href || '',
                    rating: card.querySelector('.rating')?.textContent?.trim() || '',
                    reviews: card.querySelector('.review')?.textContent?.trim() || ''
                }));
            });

            // Get detailed info for each job
            const detailedJobs = [];
            for (const job of jobs) {
                console.log(`Getting detailed info for: ${job.title}`);
                const detailedInfo = await getDetailedJobInfo(job.applyLink);
                detailedJobs.push({
                    ...job,
                    detailedInfo
                });
                await page.waitForTimeout(1000); // Delay between requests
            }

            return detailedJobs;
        };

        let pageNum = 1;
        const maxPages = 10; // Adjust number of pages to scrape

        while (pageNum <= maxPages) {
            console.log(`Scraping page ${pageNum}...`);

            // Extract jobs from current page
            const pageJobs = await extractJobs();
            allJobs.push(...pageJobs);
            console.log(`Found ${pageJobs.length} jobs on page ${pageNum}`);

            // Click next page button
            try {
                // Updated selector for next page navigation
                const nextPageUrl = await page.evaluate(() => {
                    const nextLink = document.querySelector('.styles_btn-secondary__2AsIP:not(.styles_previous__PobAs)');
                    return nextLink ? nextLink.href : null;
                });

                if (!nextPageUrl) break;
                
                // Navigate to next page
                await page.goto(nextPageUrl, {
                    waitUntil: 'networkidle0',
                    timeout: 60000
                });
                
                await page.waitForSelector('.srp-jobtuple-wrapper', { timeout: 30000 });
                await page.waitForTimeout(2000); // Wait for page to stabilize
                
                pageNum++;
            } catch (e) {
                console.log('No more pages to scrape:', e.message);
                break;
            }
        }

        // Save results
        const result = {
            total_jobs: allJobs.length,
            last_updated: new Date().toISOString(),
            jobs: allJobs
        };

        fs.writeFileSync('naukri_jobs.json', JSON.stringify(result, null, 2));
        console.log(`Successfully scraped ${allJobs.length} jobs and saved to naukri_jobs.json`);

    } catch (error) {
        console.error('Error during scraping:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the scraper
scrapeNaukriJobs();