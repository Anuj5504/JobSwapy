import React from 'react';
import { Container, Typography, Box, Card, CardContent, Divider, Paper, Alert, Stack, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import CodeBlock from '../components/CodeBlock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoIcon from '@mui/icons-material/Info';

const MigrationGuide = () => {
  const handleExportRoadmaps = () => {
    try {
      const customRoadmaps = JSON.parse(localStorage.getItem('customRoadmaps') || '[]');
      
      if (customRoadmaps.length === 0) {
        alert('No custom roadmaps found in localStorage.');
        return;
      }
      
      // Create a blob with the JSON data
      const blob = new Blob([JSON.stringify(customRoadmaps)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and click it to download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = 'custom-roadmaps.json';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Roadmaps exported successfully! You can now provide this file to your administrator for import.');
    } catch (error) {
      console.error('Error exporting roadmaps:', error);
      alert('Error exporting roadmaps. Please try again or contact support.');
    }
  };

  const handleClearLocalStorage = () => {
    if (window.confirm('Are you sure you want to clear all custom roadmaps from localStorage? This action cannot be undone.')) {
      localStorage.removeItem('customRoadmaps');
      alert('Your localStorage roadmaps have been cleared.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        component={Link}
        to="/roadmaps"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
      >
        Back to Roadmaps
      </Button>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Migrating Your Custom Roadmaps
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1">
          We've updated our system to store all roadmaps in a database instead of your browser's localStorage. 
          This guide will help you migrate your existing custom roadmaps to the new system.
        </Typography>
      </Alert>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Why We're Making This Change
        </Typography>
        
        <Typography variant="body1" paragraph>
          Storing roadmaps in localStorage has several limitations:
        </Typography>
        
        <Box component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body1">Your roadmaps are only available on the current device and browser</Typography>
          <Typography component="li" variant="body1">Data can be lost if you clear your browser cache or cookies</Typography>
          <Typography component="li" variant="body1">Limited storage space (typically 5-10MB per domain)</Typography>
          <Typography component="li" variant="body1">No ability to share roadmaps with other users</Typography>
        </Box>
        
        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          By moving to a database solution, your roadmaps will be:
        </Typography>
        
        <Box component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body1">Available on any device where you log in</Typography>
          <Typography component="li" variant="body1">Securely backed up</Typography>
          <Typography component="li" variant="body1">Not limited by browser storage constraints</Typography>
          <Typography component="li" variant="body1">Potentially shareable with other users (coming soon)</Typography>
        </Box>
      </Paper>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Migration Process
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Step 1: Export Your Roadmaps
          </Typography>
          <Typography variant="body1" paragraph>
            First, you'll need to export your existing roadmaps from localStorage to a JSON file.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<CloudUploadIcon />}
            onClick={handleExportRoadmaps}
            sx={{ mb: 2 }}
          >
            Export My Roadmaps
          </Button>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Alternative method: You can also export your roadmaps by opening your browser console and running:
          </Typography>
          
          <CodeBlock
            code="const roadmaps = JSON.parse(localStorage.getItem('customRoadmaps') || '[]');
console.log(JSON.stringify(roadmaps));"
            language="javascript"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Step 2: Import Your Roadmaps
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              This step requires administrator access to the server. Please provide your exported JSON file to your administrator.
            </Typography>
          </Alert>
          
          <Typography variant="body1" paragraph>
            The administrator will run a script that imports your roadmaps from the JSON file into the database using:
          </Typography>
          
          <CodeBlock
            code="node scripts/import-custom-roadmaps.js ./custom-roadmaps.json"
            language="bash"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Step 3: Verify Your Roadmaps
          </Typography>
          
          <Typography variant="body1" paragraph>
            After your administrator confirms the import is complete, you should:
          </Typography>
          
          <Box component="ol" sx={{ pl: 4 }}>
            <Typography component="li" variant="body1">Go to the <Link to="/roadmaps">Roadmaps page</Link></Typography>
            <Typography component="li" variant="body1">Verify that all your custom roadmaps appear in the list</Typography>
            <Typography component="li" variant="body1">Open a few roadmaps to ensure all nodes and connections are preserved</Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Step 4: Clear localStorage (Optional)
          </Typography>
          
          <Typography variant="body1" paragraph>
            Once you've verified your roadmaps are in the database, you can safely clear them from localStorage to avoid confusion:
          </Typography>
          
          <Button 
            variant="outlined" 
            color="warning"
            onClick={handleClearLocalStorage}
          >
            Clear localStorage Roadmaps
          </Button>
        </CardContent>
      </Card>
      
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button
          component={Link}
          to="/roadmaps"
          variant="outlined"
        >
          Return to Roadmaps
        </Button>
        
        <Button
          component={Link}
          to="/contact"
          variant="contained"
        >
          Need Help? Contact Us
        </Button>
      </Stack>
    </Container>
  );
};

export default MigrationGuide; 