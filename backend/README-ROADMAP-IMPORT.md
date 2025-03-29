# Roadmap Import Tool

This tool allows you to easily import roadmap data from JSON files into the MongoDB database.

## How to Use

1. Create a JSON file with your roadmap data following the template structure
2. Run the import script with the path to your JSON file
3. The script will automatically add or update roadmaps in the database

```bash
# From the backend directory
node scripts/import-roadmaps-from-json.js path/to/your/roadmaps-data.json
```

## JSON Structure

Your JSON file should contain an array of roadmap objects. Each roadmap should have the following structure:

```json
[
  {
    "id": "unique-roadmap-id",
    "slug": "unique-roadmap-id",
    "title": "Roadmap Title",
    "description": "Roadmap description...",
    "category": "other",
    "difficulty": "intermediate",
    "estimatedHours": 250,
    "prerequisites": ["Skill 1", "Skill 2"],
    "author": {
      "name": "Author Name",
      "role": "Author Role"
    },
    "nodes": [
      {
        "id": "node-1",
        "type": "input",
        "data": {
          "label": "Starting Node",
          "description": "Node description",
          "color": "#6366f1",
          "parent": "",
          "level": 0
        },
        "position": { "x": 500, "y": 50 }
      },
      {
        "id": "node-2",
        "type": "default",
        "data": {
          "label": "Child Node",
          "description": "Node description",
          "color": "#3b82f6",
          "parent": "node-1",
          "level": 1
        },
        "position": { "x": 500, "y": 150 }
      }
      // Add more nodes as needed
    ],
    "edges": [
      {
        "id": "edge-1-2",
        "source": "node-1",
        "target": "node-2",
        "animated": true
      }
      // Add more edges as needed
    ]
  }
  // Add more roadmaps as needed
]
```

## Node Hierarchy

The hierarchical structure is determined by:

1. The `parent` field in each node's data, which should contain the ID of the parent node
2. The `level` field, which indicates the depth level (0 for root nodes, 1 for first level, etc.)

## Styling

The import script will automatically apply appropriate styling to nodes and edges based on their level and parent-child relationships. You can also include custom styling in the nodes and edges if needed.

## Example Files

See `data/roadmaps-data.json` for examples of well-structured roadmap data.

## Available Roadmap IDs

Currently available roadmaps:
- frontend: Frontend Engineer
- backend: Backend Engineer
- ai-engineer: AI Engineer
- data-scientist: Data Analyst
- android: Android Developer
- cybersecurity: Cybersecurity Specialist
- blockchain: Blockchain Developer
- fullstack: Full Stack Developer
- devops: DevOps Engineer
- marketing: Digital Marketing
- product-manager: Product Manager
- ux-designer: UX Designer 