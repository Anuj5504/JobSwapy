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
            // Get full description
            const description = document.querySelector('.description__text')?.textContent?.trim();

            // Get job criteria items
            const criteriaItems = document.querySelectorAll('.description__job-criteria-item');
            let seniority = '';
            let employmentType = '';
            let jobFunction = '';
            let industries = '';

            criteriaItems.forEach(item => {
                const header = item.querySelector('.description__job-criteria-subheader')?.textContent?.trim();
                const text = item.querySelector('.description__job-criteria-text')?.textContent?.trim();
                
                if (header?.includes('Seniority')) seniority = text;
                if (header?.includes('Employment')) employmentType = text;
                if (header?.includes('function')) jobFunction = text;
                if (header?.includes('Industries')) industries = text;
            });

            // Get skills from description
            const skillsMatch = description?.match(/Suggested Skills:(.*?)(?:\n|$)/i) ||
                description?.match(/Required Skills:(.*?)(?:\n|$)/i) ||
                description?.match(/Skills:(.*?)(?:\n|$)/i);
            const skills = skillsMatch ? 
                skillsMatch[1].split(',').map(s => s.trim()).filter(s => s) : [];

            // Get experience requirements
            const experienceMatch = description?.match(/Basic Qualifications:.*?(\d+\+?\s*years?.*?experience)/i) ||
                description?.match(/Experience:.*?(\d+\+?\s*years?)/i);
            const experience = experienceMatch ? experienceMatch[1] : null;

            // Get company details
            const companyInfo = {
                name: document.querySelector('.topcard__org-name-link')?.textContent?.trim(),
                logo: document.querySelector('.artdeco-entity-image')?.getAttribute('src'),
                about: document.querySelector('.jobs-company__description')?.textContent?.trim()
            };

            // Get location and posted date
            const location = document.querySelector('.topcard__flavor--bullet')?.textContent?.trim();
            const postedDate = document.querySelector('.posted-time-ago__text')?.textContent?.trim();
            const applicantCount = document.querySelector('.num-applicants__caption')?.textContent?.trim();

            return {
                description,
                skills,
                experience,
                seniority,
                employmentType,
                jobFunction,
                industries,
                location,
                postedDate,
                applicantCount,
                companyDetails: companyInfo
            };
        });

        return jobDetails;
    } catch (error) {
        console.error('Error extracting job details:', error);
        return null;
    }
}

async function scrapeLinkedInJobs() {
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'] 
    });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://www.linkedin.com/jobs/search?keywords=Frontend%20Developer&location=India&geoId=102713980&f_TPR=r86400&position=1&pageNum=0');
        
        // Wait for job cards to load
        await page.waitForSelector('.job-search-card');
        console.log('Job cards loaded');

        // Get all job cards
        const jobCards = await page.$$('.job-search-card');
        console.log(`Found ${jobCards.length} job cards`);

        const jobs = [];
        
        // Process each job card
        for (let i = 0; i < jobCards.length; i++) {
            console.log(`Processing job ${i + 1}/${jobCards.length}`);
            
            // Get basic info from the card
            const basicInfo = await page.evaluate(card => {
                return {
                    title: card.querySelector('.base-search-card__title')?.textContent?.trim(),
                    company: card.querySelector('.base-search-card__subtitle')?.textContent?.trim(),
                    location: card.querySelector('.job-search-card__location')?.textContent?.trim(),
                    postedDate: card.querySelector('time')?.getAttribute('datetime'),
                    applyLink: card.querySelector('a.base-card__full-link')?.href,
                    companyLogo: card.querySelector('.artdeco-entity-image')?.getAttribute('data-delayed-url')
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
                    applicants: details?.applicants
                },
                description: details?.description,
                skills: details?.skills || [],
                source: "LinkedIn",
                scrapedAt: new Date().toISOString()
            };

            jobs.push(jobData);
        }

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
            source: "LinkedIn"
        };

        // Insert metadata
        await collection.updateOne(
            { type: 'metadata', source: 'LinkedIn' },
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

        console.log(`Successfully uploaded ${jobs.length} LinkedIn jobs to MongoDB`);
        await client.close();

    } catch (error) {
        console.error('Error:', error);
        await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    } finally {
        await page.waitForTimeout(5000); // Keep browser open briefly to see what happened
        await browser.close();
    }
}

// Run the scraper
scrapeLinkedInJobs(); 