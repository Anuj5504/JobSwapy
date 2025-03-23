import puppeteer from 'puppeteer';
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://sushantjoshilkar:Wweuqey4aNRXLZRY@jobportal.th186.mongodb.net/";
const dbName = "jobsDB";
const collectionName = "jobs";

async function scrapeInternshalaJobs() {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://internshala.com/internships/backend-development,front-end-development,full-stack-development,software-development,web-development-internship/page-2/');
        await page.waitForSelector('.individual_internship');

        // Get all job links first
        const jobLinks = await page.evaluate(() => {
            const links = document.querySelectorAll('.job-title-href');
            return Array.from(links).map(link => link.href);
        });

        const scrapedJobs = [];
        const scrapedAt = new Date().toISOString();

        // Visit each job page and extract detailed information
        for (const link of jobLinks) {
            try {
                await page.goto(link);
                await page.waitForSelector('.internship_details');

                const jobData = await page.evaluate(() => {
                    const title = document.querySelector('.heading_title')?.textContent?.trim() || '';
                    const company = document.querySelector('.company_name')?.textContent?.trim() || '';
                    const companyLogo = document.querySelector('.internship_logo img')?.src || null;
                    
                    // Get company details
                    const about = document.querySelector('.about_company_text_container')?.textContent?.trim() || null;
                    const openings = document.querySelector('.text-container')?.textContent?.trim() || null;
                    
                    // Get job details
                    const description = document.querySelector('.text-container')?.textContent?.trim() || '';
                    const skills = Array.from(document.querySelectorAll('.round_tabs'))
                        .map(skill => skill.textContent.trim());
                    
                    const experience = document.querySelector('.job-experience-item .item_body')?.textContent?.trim() || '0 year(s)';
                    const salary = document.querySelector('.salary_container')?.textContent?.trim() || null;
                    const location = document.querySelector('#location_names span')?.textContent?.trim() || 'Work From Home';
                    const postedDate = document.querySelector('.status-success')?.textContent?.replace('Posted', '').trim() || null;
                    const applicants = document.querySelector('.applications_message')?.textContent?.trim() || null;
                    
                    return {
                        title,
                        company,
                        companyDetails: {
                            name: company,
                            logo: companyLogo,
                            about: about,
                            rating: null,
                            reviews: null
                        },
                        jobDetails: {
                            experience,
                            salary,
                            location,
                            employmentType: "Full Time",
                            postedDate,
                            startDate: document.querySelector('#start-date-first')?.textContent?.trim() || null,
                            applicants: applicants ? parseInt(applicants) : null,
                            openings: openings ? parseInt(openings) : null
                        },
                        description,
                        skills,
                        applyLink: window.location.href,
                        source: "Internshala"
                    };
                });

                jobData.scrapedAt = scrapedAt;
                scrapedJobs.push(jobData);
                console.log(`Scraped job: ${jobData.title}`);
                
                // Add a small delay between requests
                await new Promise(r => setTimeout(r, 1000));

            } catch (error) {
                console.error(`Error scraping job details: ${error.message}`);
                continue;
            }
        }

        // Connect to MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB Atlas');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Create metadata
        const metadata = {
            total_jobs: scrapedJobs.length,
            last_updated: scrapedAt,
            source: "Internshala"
        };

        // Insert metadata
        await collection.updateOne(
            { type: 'metadata', source: 'Internshala' },
            { $set: { ...metadata, type: 'metadata' } },
            { upsert: true }
        );

        // Insert or update jobs
        for (const job of scrapedJobs) {
            await collection.updateOne(
                { 
                    applyLink: job.applyLink,
                    source: job.source 
                },
                { $set: job },
                { upsert: true }
            );
        }

        console.log(`Successfully uploaded ${scrapedJobs.length} Internshala jobs to MongoDB`);
        await client.close();

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

// Handle pagination
async function getAllPages() {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://internshala.com/internships/backend-development,front-end-development,full-stack-development,software-development,web-development-internship/page-2/');
        
        const totalPages = await page.evaluate(() => {
            const pagesText = document.querySelector('#total_pages')?.textContent;
            return parseInt(pagesText) || 1;
        });

  
            // console.log(`Scraping page ${currentPage} of ${totalPages}`);
            await scrapeInternshalaJobs();
                await page.click('#next');
                await page.waitForSelector('.individual_internship');
            
        

    } catch (error) {
        console.error('Error in pagination:', error);
    } finally {
        await browser.close();
    }
}

// Run the scraper
getAllPages(); 