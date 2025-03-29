# Migration Scripts

This directory contains scripts for various database and data migration tasks.

## Import Custom Roadmaps from localStorage

The `import-custom-roadmaps.js` script allows users to migrate their custom roadmaps from browser localStorage to the MongoDB database.

### Prerequisites

- Node.js installed on your machine
- Access to MongoDB (connection string in your `.env` file)
- The custom roadmaps JSON data extracted from localStorage

### Steps to Migrate Custom Roadmaps

1. **Extract your custom roadmaps data from localStorage**:
   - Open your application in the browser
   - Open the browser's developer console (usually F12 or right-click > Inspect)
   - Run this command in the console:
     ```javascript
     console.log(JSON.stringify(JSON.parse(localStorage.getItem('customRoadmaps') || '[]')))
     ```
   - Copy the output (it should be a JSON array)
   - Save it to a file named `custom-roadmaps.json` in the project root directory

2. **Run the import script**:
   ```bash
   node scripts/import-custom-roadmaps.js ./custom-roadmaps.json
   ```

3. **Verify the import**:
   - The script will show you which roadmaps were imported
   - You can check your application to verify that the roadmaps are now available

### Troubleshooting

- **Invalid JSON format**: Make sure the JSON file contains a valid array of roadmap objects
- **Connection error**: Verify that your MongoDB connection string in the `.env` file is correct
- **Duplicate roadmaps**: The script skips roadmaps that already exist in the database (based on ID)

## After Migration

Once you've successfully migrated your custom roadmaps to the database, you can safely clear the localStorage in your browser:

```javascript
localStorage.removeItem('customRoadmaps');
```

This will prevent any confusion between localStorage data and database data. 