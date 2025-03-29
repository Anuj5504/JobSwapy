import React from 'react';
import { Box, IconButton, Typography, Paper } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        position: 'relative', 
        mb: 3,
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          zIndex: 10,
          p: 0.5
        }}
      >
        <IconButton 
          size="small"
          onClick={handleCopy}
          color={copied ? "success" : "default"}
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
        </IconButton>
      </Box>
      
      {language && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            zIndex: 10,
            p: 0.5,
            pl: 1.5,
            pr: 1.5,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            borderBottomRightRadius: 4
          }}
        >
          <Typography variant="caption" sx={{ color: '#e0e0e0' }}>
            {language}
          </Typography>
        </Box>
      )}
      
      <SyntaxHighlighter
        language={language || 'javascript'}
        style={materialDark}
        customStyle={{
          margin: 0,
          padding: '32px 16px 16px 16px',
          borderRadius: 4,
          fontSize: '0.875rem'
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Paper>
  );
};

export default CodeBlock; 