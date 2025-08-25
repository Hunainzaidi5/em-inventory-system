// Test script for digital signature functionality
// Copy and paste this into your browser console

console.log('🖊️ Digital Signature Test');
console.log('==========================');

// Test 1: Check if SignaturePad component is available
function testSignaturePadComponent() {
  console.log('\n📋 Test 1: SignaturePad Component');
  
  // Check if the component is imported and available
  if (window.SignaturePad) {
    console.log('✅ SignaturePad component is available globally');
  } else {
    console.log('❌ SignaturePad component not available globally');
    console.log('ℹ️  This is normal - components are not exposed globally in React');
  }
}

// Test 2: Check for signature fields in forms
function testSignatureFields() {
  console.log('\n📝 Test 2: Signature Fields in Forms');
  
  // Look for signature pad elements
  const signaturePads = document.querySelectorAll('[data-signature-pad]');
  if (signaturePads.length > 0) {
    console.log(`✅ Found ${signaturePads.length} signature pad elements`);
  } else {
    console.log('ℹ️  No signature pad elements found (this is normal if not on a form page)');
  }
  
  // Look for canvas elements (signature drawing areas)
  const canvasElements = document.querySelectorAll('canvas');
  if (canvasElements.length > 0) {
    console.log(`✅ Found ${canvasElements.length} canvas elements (potential signature areas)`);
  } else {
    console.log('ℹ️  No canvas elements found');
  }
  
  // Look for file upload inputs
  const fileInputs = document.querySelectorAll('input[type="file"]');
  if (fileInputs.length > 0) {
    console.log(`✅ Found ${fileInputs.length} file upload inputs`);
  } else {
    console.log('ℹ️  No file upload inputs found');
  }
}

// Test 3: Check for signature-related buttons
function testSignatureButtons() {
  console.log('\n🔘 Test 3: Signature Buttons');
  
  const buttons = document.querySelectorAll('button');
  const signatureButtons = Array.from(buttons).filter(button => 
    button.textContent.toLowerCase().includes('signature') ||
    button.textContent.toLowerCase().includes('draw') ||
    button.textContent.toLowerCase().includes('upload') ||
    button.textContent.toLowerCase().includes('clear')
  );
  
  if (signatureButtons.length > 0) {
    console.log(`✅ Found ${signatureButtons.length} signature-related buttons:`);
    signatureButtons.forEach((button, index) => {
      console.log(`   ${index + 1}. "${button.textContent.trim()}"`);
    });
  } else {
    console.log('ℹ️  No signature-related buttons found');
  }
}

// Test 4: Check for signature images
function testSignatureImages() {
  console.log('\n🖼️ Test 4: Signature Images');
  
  const images = document.querySelectorAll('img');
  const signatureImages = Array.from(images).filter(img => 
    img.alt?.toLowerCase().includes('signature') ||
    img.src?.startsWith('data:image/')
  );
  
  if (signatureImages.length > 0) {
    console.log(`✅ Found ${signatureImages.length} signature images:`);
    signatureImages.forEach((img, index) => {
      console.log(`   ${index + 1}. Alt: "${img.alt || 'No alt'}", Type: ${img.src.startsWith('data:') ? 'Base64' : 'URL'}`);
    });
  } else {
    console.log('ℹ️  No signature images found');
  }
}

// Test 5: Check page context
function testPageContext() {
  console.log('\n📄 Test 5: Page Context');
  
  console.log('Current URL:', window.location.href);
  console.log('Page title:', document.title);
  
  // Check if we're on a relevant page
  const relevantPages = ['requisition', 'issuance', 'form'];
  const isRelevantPage = relevantPages.some(page => 
    window.location.pathname.toLowerCase().includes(page) ||
    document.title.toLowerCase().includes(page)
  );
  
  if (isRelevantPage) {
    console.log('✅ On a page that should have signature functionality');
  } else {
    console.log('⚠️  Not on a page that typically has signature functionality');
    console.log('ℹ️  Try navigating to /dashboard/requisition or /dashboard/issuance');
  }
}

// Test 6: Manual verification instructions
function testManualVerification() {
  console.log('\n🔍 Test 6: Manual Verification Steps');
  
  console.log('To test the digital signature functionality:');
  console.log('1. Navigate to /dashboard/requisition');
  console.log('2. Click "New Requisition"');
  console.log('3. Scroll to the "Issuer Details" section');
  console.log('4. Look for the "Signature" field');
  console.log('5. Try clicking the "Draw" tab and drawing with your mouse');
  console.log('6. Try clicking the "Upload" tab and uploading an image');
  console.log('7. Check if the signature appears in the preview');
  console.log('8. Submit the form and check if signature appears in issuance form');
}

// Run all tests
function runSignatureTests() {
  console.log('🚀 Running digital signature tests...\n');
  
  testSignaturePadComponent();
  testSignatureFields();
  testSignatureButtons();
  testSignatureImages();
  testPageContext();
  testManualVerification();
  
  console.log('\n🎉 Digital signature tests completed!');
  console.log('Check the results above and follow the manual verification steps.');
}

// Export functions for manual testing
window.signatureTest = {
  testSignaturePadComponent,
  testSignatureFields,
  testSignatureButtons,
  testSignatureImages,
  testPageContext,
  testManualVerification,
  runSignatureTests
};

console.log('📝 Available test functions:');
console.log('  - signatureTest.runSignatureTests() - Run all tests');
console.log('  - signatureTest.testSignatureFields() - Test signature fields');
console.log('  - signatureTest.testManualVerification() - Show manual steps');

// Auto-run tests
setTimeout(() => {
  console.log('\n🔄 Auto-running signature tests in 2 seconds...');
  setTimeout(runSignatureTests, 2000);
}, 1000);
