import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, Button, Stack, IconButton, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const MigrationNotice = () => {
  const [open, setOpen] = useState(false);
  const [hasLocalRoadmaps, setHasLocalRoadmaps] = useState(false);
  const [roadmapCount, setRoadmapCount] = useState(0);

  useEffect(() => {
    // Check if user has custom roadmaps in localStorage
    const customRoadmaps = JSON.parse(localStorage.getItem('customRoadmaps') || '[]');
    setHasLocalRoadmaps(customRoadmaps.length > 0);
    setRoadmapCount(customRoadmaps.length);
    
    // Only show notification if there are roadmaps to migrate
    if (customRoadmaps.length > 0) {
      // Don't show if user has dismissed this notice before
      const noticeDismissed = localStorage.getItem('migrationNoticeDismissed');
      setOpen(!noticeDismissed);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    // Remember that user dismissed this notice
    localStorage.setItem('migrationNoticeDismissed', 'true');
  };

  const handleExportJson = () => {
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
      
      alert('Roadmaps exported successfully! Follow the migration guide for next steps.');
    } catch (error) {
      console.error('Error exporting roadmaps:', error);
      alert('Error exporting roadmaps. Please try again or contact support.');
    }
  };

  if (!hasLocalRoadmaps || !open) {
    return null;
  }

  return (
    <Collapse in={open}>
      <Alert
        severity="info"
        sx={{ 
          mb: 2, 
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' }
        }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        <AlertTitle>Migration Notice</AlertTitle>
        <p>
          We've detected {roadmapCount} custom roadmap{roadmapCount !== 1 ? 's' : ''} in your browser's local storage.
          Our application now saves all roadmaps directly to the database for better reliability and access across devices.
        </p>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={1}>
          <Button 
            variant="contained" 
            startIcon={<CloudUploadIcon />}
            onClick={handleExportJson}
            color="primary"
          >
            Export Roadmaps
          </Button>
          <Button 
            variant="outlined"
            component={Link}
            to="/migration-guide"
          >
            View Migration Guide
          </Button>
        </Stack>
      </Alert>
    </Collapse>
  );
};

export default MigrationNotice; 