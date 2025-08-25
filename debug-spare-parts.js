// Debug script for spare parts - run this in browser console
// Copy and paste this into your browser console when on the requisition page

async function debugSpareParts() {
  console.log('=== Debugging Spare Parts ===');
  
  try {
    // Import the spare service (you might need to adjust the import path)
    const spareService = window.spareService || await import('/src/services/spareService.ts').then(m => m.spareService);
    
    // Get all spare parts
    console.log('Fetching all spare parts...');
    const allParts = await spareService.getAllSpareParts();
    console.log('All spare parts:', allParts);
    console.log('Total spare parts:', allParts.length);
    
    // Show spare parts by name
    console.log('Spare parts by name:');
    allParts.forEach((part, index) => {
      console.log(`${index + 1}. ID: ${part.id}, Name: ${part.name}, Quantity: ${part.quantity}, Category: ${part.category}`);
    });
    
    // Test finding a specific spare part by name
    const testName = prompt('Enter a spare part name to search for:');
    if (testName) {
      const foundPart = allParts.find(part => 
        part.name.toLowerCase().includes(testName.toLowerCase())
      );
      console.log(`Found part for "${testName}":`, foundPart);
    }
    
  } catch (error) {
    console.error('Error debugging spare parts:', error);
  }
}

// Alternative simpler version if the above doesn't work
function simpleDebugSpareParts() {
  console.log('=== Simple Spare Parts Debug ===');
  
  // Check if spareService is available globally
  if (window.spareService) {
    console.log('spareService is available globally');
    window.spareService.getAllSpareParts()
      .then(parts => {
        console.log('All spare parts:', parts);
        console.log('Total count:', parts.length);
      })
      .catch(err => console.error('Error:', err));
  } else {
    console.log('spareService not available globally');
    console.log('Available global objects:', Object.keys(window).filter(key => key.includes('spare')));
  }
}

// Run the debug function
console.log('Run debugSpareParts() or simpleDebugSpareParts() to debug spare parts');
