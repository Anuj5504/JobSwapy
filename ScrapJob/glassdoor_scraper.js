import puppeteer from 'puppeteer';
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://sushantjoshilkar:Wweuqey4aNRXLZRY@jobportal.th186.mongodb.net/";
const dbName = "jobsDB";
const collectionName = "jobs";

async function scrapeJobDetails(page, jobCard) {
    try {
        // Click on the job card to open details
        await jobCard.click();
        await page.waitForTimeout(2000); // Wait for content to load

        // Extract detailed information
        const jobDetails = await page.evaluate(() => {
            // Get full description - using the correct selector from your HTML
            const description = document.querySelector('.JobDetails_jobDescriptionWrapper__BTDTA')?.textContent?.trim() 
                || document.querySelector('.JobDetails_jobDescription__uW_fK')?.textContent?.trim();
            
            // Get skills - look for them in the description
            const skillsMatch = description?.match(/Skills:([^.]*)/i) 
                || description?.match(/Technical Skills:([^.]*)/i)
                || description?.match(/Required Skills:([^.]*)/i);
            const skills = skillsMatch ? 
                skillsMatch[1].split(',').map(s => s.trim()).filter(s => s) : [];

            // Get experience requirements - look for multiple patterns
            const experiencePatterns = [
                /(\d+)\+?\s*years?.*experience/i,
                /experience.*?(\d+)\+?\s*years?/i,
                /Experience:.*?(\d+)\+?\s*years?/i
            ];
            
            let experience = null;
            for (const pattern of experiencePatterns) {
                const match = description?.match(pattern);
                if (match) {
                    experience = match[1];
                    break;
                }
            }

            // Get employment type
            const employmentTypeMatch = description?.match(/Job Type:?\s*([^.\n]+)/i) 
                || description?.match(/Employment Type:?\s*([^.\n]+)/i);
            const employmentType = employmentTypeMatch ? employmentTypeMatch[1].trim() : "Full-time";

            // Get salary details - try multiple selectors
            const salaryText = document.querySelector('.SalaryEstimate_salaryEstimateNumber__SC4__')?.textContent?.trim()
                || document.querySelector('[data-test="detailSalary"]')?.textContent?.trim()
                || document.querySelector('.JobCard_salaryEstimate__QpbTW')?.textContent?.trim();

            // Get company details
            const companyAbout = document.querySelector('.CompanyDescription_companyDescription__Gm7_r')?.textContent?.trim()
                || document.querySelector('.EmployerProfile_employerInfo___kmLv')?.textContent?.trim();
            
            const rating = document.querySelector('.rating-single-star_RatingText__XENmU')?.textContent?.trim();
            const reviews = document.querySelector('.CompanyRatings_ratingCount__8IHV4')?.textContent?.trim();

            // Get location details
            const location = document.querySelector('.JobDetails_location__Ds1fM')?.textContent?.trim()
                || document.querySelector('[data-test="emp-location"]')?.textContent?.trim();

            // Get posted date
            const postedDate = document.querySelector('.JobDetails_jobDetailsHeaderItem__tLqLh')?.textContent?.trim()
                || document.querySelector('[data-test="job-age"]')?.textContent?.trim();

            // Get application link
            const applyLink = document.querySelector('a[data-test="job-link"]')?.href
                || document.querySelector('.JobCard_trackingLink__HMyun')?.href;

            return {
                description,
                skills,
                experience,
                employmentType,
                salary: salaryText,
                location,
                postedDate,
                applyLink,
                companyDetails: {
                    about: companyAbout,
                    rating,
                    reviews
                }
            };
        });

        return jobDetails;
    } catch (error) {
        console.error('Error extracting job details:', error);
        return null;
    }
}

async function scrapeGlassdoorJobs() {
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list'
        ]
    });
    
    const page = await browser.newPage();
    
    // Set a reasonable viewport
    await page.setViewport({ width: 1366, height: 768 });
    
    // Add header to look more like a real browser
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
    });

    try {
        console.log('Navigating to Glassdoor...');
        await page.goto('https://www.glassdoor.co.in/Job/remote-backend-jobs-SRCH_IL.0,6_IS12563_KO7,14.htm?sortBy=date_desc', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait for initial page load
        await page.waitForTimeout(3000);

        // Handle initial popup if it appears
        try {
            const closeButton = await page.$('button.CloseButton');
            if (closeButton) {
                await closeButton.click();
                console.log('Closed initial popup');
                await page.waitForTimeout(1000);
            }
        } catch (err) {
            console.log('No initial popup found');
        }

        // Handle "Never Miss an Opportunity" popup if it appears
        try {
            const opportunityPopup = await page.$('div[data-test="authModalContainerV2-content"] button.CloseButton');
            if (opportunityPopup) {
                await opportunityPopup.click();
                console.log('Closed opportunity popup');
                await page.waitForTimeout(1000);
            }
        } catch (err) {
            console.log('No opportunity popup found');
        }

        // Wait and check for job listings
        console.log('Waiting for job listings...');
        
        // Try different selectors one by one
        const selectors = [
            '.JobsList_wrapper__EyUF6',
            '.JobsList_jobsList__lqjTr',
            'li[data-test="jobListing"]',
            '.JobCard_jobTitle__GLyJ1'
        ];

        let foundSelector = null;
        for (const selector of selectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                foundSelector = selector;
                console.log(`Found jobs with selector: ${selector}`);
                break;
            } catch (err) {
                console.log(`Selector ${selector} not found, trying next...`);
            }
        }

        if (!foundSelector) {
            throw new Error('Could not find job listings with any selector');
        }

        // Take screenshot to debug
        await page.screenshot({ path: 'debug-listings.png', fullPage: true });

        // Get all job cards
        const jobCards = await page.$$('li[data-test="jobListing"]');
        console.log(`Found ${jobCards.length} job cards`);

        const jobs = [];
        
        // Process each job card
        for (let i = 0; i < jobCards.length; i++) {
            console.log(`Processing job ${i + 1}/${jobCards.length}`);
            
            // Get basic info from the card
            const basicInfo = await page.evaluate(card => {
                return {
                    title: card.querySelector('[data-test="job-title"]')?.textContent?.trim(),
                    company: card.querySelector('.EmployerProfile_compactEmployerName__9MGcV')?.textContent?.trim(),
                    location: card.querySelector('[data-test="emp-location"]')?.textContent?.trim(),
                    postedDate: card.querySelector('[data-test="job-age"]')?.textContent?.trim(),
                    applyLink: card.querySelector('[data-test="job-link"]')?.href,
                    companyLogo: card.querySelector('.avatar-base_Image__2RcF9')?.src
                };
            }, jobCards[i]);

            // Get detailed info by clicking the job
            const details = await scrapeJobDetails(page, jobCards[i]);

            // Combine all information
            const jobData = {
                ...basicInfo,
                companyDetails: {
                    name: basicInfo.company,
                    logo: basicInfo.companyLogo,
                    ...details?.companyDetails
                },
                jobDetails: {
                    experience: details?.experience,
                    salary: details?.salary,
                    location: basicInfo.location,
                    employmentType: details?.employmentType,
                    postedDate: basicInfo.postedDate,
                    startDate: null,
                    applicants: null,
                    openings: null
                },
                description: details?.description,
                skills: details?.skills || [],
                source: "Glassdoor",
                scrapedAt: new Date().toISOString()
            };

            jobs.push(jobData);
        }

        console.log(`Extracted ${jobs.length} jobs`);

        // Connect to MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB Atlas');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Create metadata
        const metadata = {
            total_jobs: jobs.length,
            last_updated: new Date().toISOString(),
            source: "Glassdoor"
        };

        // Insert metadata
        await collection.updateOne(
            { type: 'metadata', source: 'Glassdoor' },
            { $set: { ...metadata, type: 'metadata' } },
            { upsert: true }
        );

        // Insert or update jobs
        for (const job of jobs) {
            await collection.updateOne(
                { 
                    applyLink: job.applyLink,
                    source: job.source 
                },
                { $set: job },
                { upsert: true }
            );
        }

        console.log(`Successfully uploaded ${jobs.length} Glassdoor jobs to MongoDB`);
        await client.close();

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    } finally {
        // Keep the browser open for 5 seconds so you can see what happened
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

// Run the scraper
scrapeGlassdoorJobs(); 