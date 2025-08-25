// Test script for inventory management system
// Copy and paste this into your browser console to test the fixes

console.log('🧪 Inventory Management System Test Suite');
console.log('==========================================');

// Test 1: Check if spare parts are accessible
async function testSpareParts() {
  console.log('\n📦 Test 1: Spare Parts Access');
  console.log('-----------------------------');
  
  try {
    // Try to access spareService
    if (window.spareService) {
      console.log('✅ spareService is available globally');
      
      const parts = await window.spareService.getAllSpareParts();
      console.log(`✅ Found ${parts.length} spare parts`);
      
      if (parts.length > 0) {
        console.log('📋 Sample spare parts:');
        parts.slice(0, 3).forEach((part, index) => {
          console.log(`   ${index + 1}. ${part.name} (ID: ${part.id}, Qty: ${part.quantity})`);
        });
      } else {
        console.log('⚠️  No spare parts found in database');
      }
    } else {
      console.log('❌ spareService not available globally');
    }
  } catch (error) {
    console.error('❌ Error testing spare parts:', error);
  }
}

// Test 2: Check avatar utilities
function testAvatarUtils() {
  console.log('\n👤 Test 2: Avatar Utilities');
  console.log('---------------------------');
  
  try {
    if (window.getAvatarUrl) {
      console.log('✅ getAvatarUrl function is available');
      
      // Test default avatar
      const defaultAvatar = window.getAvatarUrl('test-user');
      console.log('✅ Default avatar URL generated:', defaultAvatar);
    } else {
      console.log('❌ getAvatarUrl function not available');
    }
  } catch (error) {
    console.error('❌ Error testing avatar utilities:', error);
  }
}

// Test 3: Check Firebase connection
async function testFirebaseConnection() {
  console.log('\n🔥 Test 3: Firebase Connection');
  console.log('-----------------------------');
  
  try {
    if (window.FirebaseService) {
      console.log('✅ FirebaseService is available');
      
      // Try a simple query
      const testData = await window.FirebaseService.query('users', []);
      console.log(`✅ Firebase connection working (${testData.length} users found)`);
    } else {
      console.log('❌ FirebaseService not available globally');
    }
  } catch (error) {
    console.error('❌ Error testing Firebase connection:', error);
  }
}

// Test 4: Check for CORS errors
function testCORS() {
  console.log('\n🌐 Test 4: CORS Issues');
  console.log('----------------------');
  
  // Check if there are any CORS errors in the console
  const corsErrors = performance.getEntriesByType('resource')
    .filter(entry => entry.name.includes('firebasestorage.googleapis.com'))
    .filter(entry => entry.transferSize === 0);
  
  if (corsErrors.length > 0) {
    console.log('❌ Found CORS errors with Firebase Storage:', corsErrors.length);
    corsErrors.forEach(error => {
      console.log(`   - ${error.name}`);
    });
  } else {
    console.log('✅ No CORS errors detected');
  }
}

// Test 5: Check for undefined field errors
function testUndefinedFields() {
  console.log('\n🔍 Test 5: Undefined Field Issues');
  console.log('--------------------------------');
  
  // This is more of a manual check - look for errors in console
  console.log('ℹ️  Check console for "Unsupported field value: undefined" errors');
  console.log('ℹ️  If you see these errors, the undefined field fix may not be working');
}

// Test 6: Simulate spare part lookup
async function testSparePartLookup() {
  console.log('\n🔎 Test 6: Spare Part Lookup');
  console.log('----------------------------');
  
  try {
    if (window.spareService) {
      const parts = await window.spareService.getAllSpareParts();
      
      if (parts.length > 0) {
        const testPart = parts[0];
        console.log(`🔍 Testing lookup for: ${testPart.name} (ID: ${testPart.id})`);
        
        const foundPart = await window.spareService.getSparePartById(testPart.id);
        if (foundPart) {
          console.log('✅ Spare part lookup successful');
        } else {
          console.log('❌ Spare part lookup failed');
        }
      } else {
        console.log('⚠️  No spare parts available for testing');
      }
    }
  } catch (error) {
    console.error('❌ Error testing spare part lookup:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive system test...\n');
  
  await testSpareParts();
  testAvatarUtils();
  await testFirebaseConnection();
  testCORS();
  testUndefinedFields();
  await testSparePartLookup();
  
  console.log('\n🎉 Test suite completed!');
  console.log('Check the results above for any issues.');
}

// Export functions for manual testing
window.testInventorySystem = {
  testSpareParts,
  testAvatarUtils,
  testFirebaseConnection,
  testCORS,
  testUndefinedFields,
  testSparePartLookup,
  runAllTests
};

console.log('📝 Available test functions:');
console.log('  - testInventorySystem.runAllTests() - Run all tests');
console.log('  - testInventorySystem.testSpareParts() - Test spare parts');
console.log('  - testInventorySystem.testAvatarUtils() - Test avatar utilities');
console.log('  - testInventorySystem.testFirebaseConnection() - Test Firebase');
console.log('  - testInventorySystem.testCORS() - Check for CORS errors');
console.log('  - testInventorySystem.testSparePartLookup() - Test spare part lookup');

// Auto-run tests after a short delay
setTimeout(() => {
  console.log('\n🔄 Auto-running tests in 2 seconds...');
  setTimeout(runAllTests, 2000);
}, 1000);
