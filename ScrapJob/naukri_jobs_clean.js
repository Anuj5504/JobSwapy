import fs from 'fs';
import { MongoClient } from 'mongodb';

// MongoDB Atlas connection URI
const uri = "mongodb+srv://sushantjoshilkar:Wweuqey4aNRXLZRY@jobportal.th186.mongodb.net/";
const dbName = "jobsDB";
const collectionName = "jobs";

async function uploadToMongoDB() {
    try {
        // Read the original jobs file
        const rawData = fs.readFileSync('naukri_jobs.json');
        const jobsData = JSON.parse(rawData);

        // Clean and restructure the jobs data
        const cleanedJobs = jobsData.jobs.map(job => {
            // Base job object with required fields
            const cleanJob = {
                title: job.title,
                company: job.company,
                companyDetails: {
                    name: job.company,
                    logo: job.companyLogo || null,
                    about: job.detailedInfo?.companyDetails?.about || null,
                    rating: job.rating || null,
                    reviews: job.reviews || null
                },
                jobDetails: {
                    experience: job.experience || null,
                    salary: job.salary || null,
                    location: job.location,
                    employmentType: "Internship",
                    postedDate: job.detailedInfo?.companyDetails?.postedDate || job.postedDate || null,
                    startDate: job.postedDate || null,
                    applicants: job.detailedInfo?.companyDetails?.applicants || null,
                    openings: job.detailedInfo?.companyDetails?.openings || null
                },
                description: job.detailedInfo?.fullDescription || null,
                skills: job.detailedInfo?.keySkills || [],
                applyLink: job.applyLink,
                source: "Naukri",
                scrapedAt: jobsData.last_updated
            };

            // Remove any null values
            Object.keys(cleanJob).forEach(key => {
                if (cleanJob[key] === null) {
                    delete cleanJob[key];
                }
            });

            return cleanJob;
        });

        // Connect to MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB Atlas');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Create metadata document
        const metadata = {
            total_jobs: cleanedJobs.length,
            last_updated: jobsData.last_updated,
            source: "Naukri"
        };

        // Insert metadata
        await collection.updateOne(
            { type: 'metadata', source: 'Naukri' },
            { $set: { ...metadata, type: 'metadata' } },
            { upsert: true }
        );

        // Insert or update jobs
        for (const job of cleanedJobs) {
            await collection.updateOne(
                { 
                    applyLink: job.applyLink,
                    source: job.source 
                },
                { $set: job },
                { upsert: true }
            );
        }

        console.log(`Successfully uploaded ${cleanedJobs.length} jobs to MongoDB`);
        await client.close();

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the upload
uploadToMongoDB(); 