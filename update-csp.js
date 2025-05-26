const fs = require('fs');
const path = require('path');

// Directory where HTML files are located
const publicDir = path.join(__dirname, 'public');

// Function to update CSP in HTML files
function updateCSP(filePath) {
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Render URLs with Vercel URLs in CSP
    content = content.replace(
      /https:\/\/dialectica\.onrender\.com/g, 
      'https://dialectica-vercel.vercel.app'
    );
    
    content = content.replace(
      /wss:\/\/dialectica\.onrender\.com/g, 
      'wss://dialectica-vercel.vercel.app'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated CSP in ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`Error updating ${path.basename(filePath)}: ${err.message}`);
  }
}

// Process all HTML files in the public directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(filePath);
    } else if (path.extname(file).toLowerCase() === '.html') {
      // Update CSP in HTML files
      updateCSP(filePath);
    }
  });
}

// Start processing
console.log('Updating Content Security Policy in all HTML files...');
processDirectory(publicDir);
console.log('Done!');
