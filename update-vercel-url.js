const fs = require('fs');
const path = require('path');

// Directory where JS files are located
const jsDir = path.join(__dirname, 'public', 'js');
const htmlDir = path.join(__dirname, 'public');

// The incorrect URL we want to replace
const oldUrl = 'dialectica-vercel.vercel.app';

// The correct Vercel URL
const newUrl = 'dialectica-seven.vercel.app';

// Function to update URLs in files
function updateURLs(filePath) {
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file contains the old URL
    if (content.includes(oldUrl)) {
      // Replace all instances of the old URL with the new URL
      const updatedContent = content.replace(
        new RegExp(oldUrl, 'g'), 
        newUrl
      );
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated URLs in ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`Error updating ${path.basename(filePath)}: ${err.message}`);
  }
}

// Process all files in a directory
function processDirectory(dir, extensions) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(filePath, extensions);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        // Update URLs in files with matching extensions
        updateURLs(filePath);
      }
    }
  });
}

// Start processing
console.log('Updating Vercel URLs in all JS and HTML files...');
processDirectory(jsDir, ['.js']);
processDirectory(htmlDir, ['.html']);
console.log('Done!');
