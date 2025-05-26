const fs = require('fs');
const path = require('path');

// Directory where JS files are located
const jsDir = path.join(__dirname, 'public', 'js');

// Function to update URLs in JS files
function updateURLs(filePath) {
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file contains any Render URLs
    if (content.includes('dialectica.onrender.com')) {
      // Replace all Render URLs with Vercel URLs
      const updatedContent = content.replace(
        /https:\/\/dialectica\.onrender\.com/g, 
        'https://dialectica-vercel.vercel.app'
      );
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated URLs in ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`Error updating ${path.basename(filePath)}: ${err.message}`);
  }
}

// Process all JS files in the directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(filePath);
    } else if (path.extname(file).toLowerCase() === '.js') {
      // Update URLs in JS files
      updateURLs(filePath);
    }
  });
}

// Start processing
console.log('Updating Render URLs to Vercel URLs in all JS files...');
processDirectory(jsDir);
console.log('Done!');
