// Simple test script for inventory management system
// Copy and paste this into your browser console

console.log('🧪 Simple Inventory System Test');
console.log('==============================');

// Test 1: Check if we're on the right page
function testPageContext() {
  console.log('\n📄 Test 1: Page Context');
  console.log('Current URL:', window.location.href);
  console.log('Page title:', document.title);
  
  // Check if we're on a dashboard page
  if (window.location.pathname.includes('/dashboard')) {
    console.log('✅ On dashboard page');
  } else {
    console.log('⚠️  Not on dashboard page');
  }
}

// Test 2: Check for CORS errors
function testCORS() {
  console.log('\n🌐 Test 2: CORS Issues');
  
  // Look for any failed requests in the network tab
  const failedRequests = performance.getEntriesByType('resource')
    .filter(entry => entry.transferSize === 0 && entry.duration > 0);
  
  if (failedRequests.length > 0) {
    console.log('❌ Found failed requests:', failedRequests.length);
    failedRequests.slice(0, 5).forEach(req => {
      console.log(`   - ${req.name} (${req.duration.toFixed(2)}ms)`);
    });
  } else {
    console.log('✅ No failed requests detected');
  }
  
  // Check specifically for Firebase Storage errors
  const storageErrors = performance.getEntriesByType('resource')
    .filter(entry => entry.name.includes('firebasestorage.googleapis.com'))
    .filter(entry => entry.transferSize === 0);
  
  if (storageErrors.length > 0) {
    console.log('❌ Found Firebase Storage errors:', storageErrors.length);
  } else {
    console.log('✅ No Firebase Storage errors detected');
  }
}

// Test 3: Check for console errors
function testConsoleErrors() {
  console.log('\n🔍 Test 3: Console Errors');
  
  // This is a manual check - look for red error messages in console
  console.log('ℹ️  Check the console for any red error messages');
  console.log('ℹ️  Look for "Unsupported field value: undefined" errors');
  console.log('ℹ️  Look for "Spare part not found" errors');
  console.log('ℹ️  Look for CORS errors');
}

// Test 4: Check for global objects
function testGlobalObjects() {
  console.log('\n🌍 Test 4: Global Objects');
  
  const globalObjects = [
    'spareService',
    'FirebaseService', 
    'getAvatarUrl',
    'authService',
    'userService'
  ];
  
  globalObjects.forEach(obj => {
    if (window[obj]) {
      console.log(`✅ ${obj} is available`);
    } else {
      console.log(`❌ ${obj} is not available`);
    }
  });
}

// Test 5: Check for form elements
function testFormElements() {
  console.log('\n📝 Test 5: Form Elements');
  
  // Look for requisition form
  const requisitionForm = document.querySelector('form');
  if (requisitionForm) {
    console.log('✅ Found form element');
    
    // Check for issuer fields
    const issuerFields = [
      'issuer_designation',
      'issuer_contact', 
      'issuer_signature',
      'issuer_olt_no'
    ];
    
    issuerFields.forEach(field => {
      const input = document.querySelector(`[name="${field}"]`) || 
                   document.querySelector(`input[placeholder*="${field.replace('_', ' ')}"]`);
      if (input) {
        console.log(`✅ Found issuer field: ${field}`);
      } else {
        console.log(`❌ Missing issuer field: ${field}`);
      }
    });
  } else {
    console.log('❌ No form element found');
  }
}

// Test 6: Check for spare parts data
async function testSparePartsData() {
  console.log('\n📦 Test 6: Spare Parts Data');
  
  try {
    // Try to access spareService if available
    if (window.spareService) {
      console.log('✅ spareService is available');
      
      const parts = await window.spareService.getAllSpareParts();
      console.log(`✅ Found ${parts.length} spare parts`);
      
      if (parts.length > 0) {
        console.log('📋 Sample spare parts:');
        parts.slice(0, 3).forEach((part, index) => {
          console.log(`   ${index + 1}. ${part.name} (Qty: ${part.quantity})`);
        });
      }
    } else {
      console.log('❌ spareService not available');
      console.log('ℹ️  Try navigating to the requisition page first');
    }
  } catch (error) {
    console.error('❌ Error testing spare parts:', error);
  }
}

// Run all tests
async function runSimpleTests() {
  console.log('🚀 Running simple tests...\n');
  
  testPageContext();
  testCORS();
  testConsoleErrors();
  testGlobalObjects();
  testFormElements();
  await testSparePartsData();
  
  console.log('\n🎉 Simple tests completed!');
  console.log('Check the results above for any issues.');
}

// Export functions for manual testing
window.simpleTest = {
  testPageContext,
  testCORS,
  testConsoleErrors,
  testGlobalObjects,
  testFormElements,
  testSparePartsData,
  runSimpleTests
};

console.log('📝 Available test functions:');
console.log('  - simpleTest.runSimpleTests() - Run all tests');
console.log('  - simpleTest.testPageContext() - Test page context');
console.log('  - simpleTest.testCORS() - Check for CORS errors');
console.log('  - simpleTest.testSparePartsData() - Test spare parts');

// Auto-run tests
setTimeout(() => {
  console.log('\n🔄 Auto-running simple tests in 2 seconds...');
  setTimeout(runSimpleTests, 2000);
}, 1000);
