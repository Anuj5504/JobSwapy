import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://sushantjoshilkar:Wweuqey4aNRXLZRY@jobportal.th186.mongodb.net/";
const dbName = "jobsDB";
const collectionName = "jobs";

async function deleteLinkedInJobs() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Delete all jobs with source "LinkedIn"
        const result = await collection.deleteMany({ source: "LinkedIn" });

        // Also delete LinkedIn metadata
        await collection.deleteOne({ type: 'metadata', source: 'LinkedIn' });

        console.log(`Successfully deleted ${result.deletedCount} LinkedIn jobs`);

    } catch (error) {
        console.error('Error deleting LinkedIn jobs:', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run the deletion
deleteLinkedInJobs(); 