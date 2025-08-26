// Test script to verify encryption/decryption fixes
const crypto = require('crypto');

// Simulate the key generation and import process
function simulateKeyImport(hex) {
  console.log('=== Testing Key Import ===');
  console.log('Input hex:', hex);
  console.log('Hex length:', hex.length);
  
  // Validate hex format
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    console.error('❌ Invalid hex format');
    return null;
  }
  
  if (hex.length !== 32) {
    console.error('❌ Invalid key length:', hex.length, 'expected 32');
    return null;
  }
  
  console.log('✅ Hex validation passed');
  
  // Convert hex to bytes
  const src = Buffer.from(hex, 'hex');
  console.log('Converted to bytes:', src.length, 'bytes');
  
  // Generate SHA-256 digest
  const digest = crypto.createHash('sha256').update(src).digest();
  console.log('SHA-256 digest:', digest.length, 'bytes');
  
  return digest;
}

// Test encryption/decryption
function testEncryptionDecryption(key) {
  console.log('\n=== Testing Encryption/Decryption ===');
  
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(12);
  const plaintext = 'Hello, Quantum World!';
  
  console.log('Plaintext:', plaintext);
  console.log('IV length:', iv.length, 'bytes');
  
  try {
    // Encrypt
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    
    console.log('✅ Encryption successful');
    console.log('Ciphertext length:', encrypted.length);
    console.log('Auth tag length:', authTag.length);
    
    // Decrypt
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log('✅ Decryption successful');
    console.log('Decrypted:', decrypted);
    
    if (decrypted === plaintext) {
      console.log('✅ Test passed: encryption/decryption working correctly');
    } else {
      console.log('❌ Test failed: decrypted text does not match original');
    }
    
  } catch (error) {
    console.error('❌ Encryption/decryption test failed:', error.message);
  }
}

// Test with a sample key
const testKey = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
console.log('Testing with key:', testKey.substring(0, 16) + '...');

const importedKey = simulateKeyImport(testKey);
if (importedKey) {
  testEncryptionDecryption(importedKey);
} else {
  console.log('❌ Key import failed, cannot test encryption/decryption');
}

// Test with invalid keys
console.log('\n=== Testing Invalid Keys ===');
const invalidKeys = [
  'invalid-hex-key',
  '1234567890abcdef', // too short
  '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' // too long
];

invalidKeys.forEach((key, index) => {
  console.log(`\nTest ${index + 1}:`, key);
  simulateKeyImport(key);
});
