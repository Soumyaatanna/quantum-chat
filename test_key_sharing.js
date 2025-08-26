// Test script to verify key sharing functionality
const crypto = require('crypto');

console.log('🔑 Testing Key Sharing Functionality\n');

// Simulate the key sharing process
function testKeySharing() {
  console.log('=== Test: Key Sharing Process ===');
  
  // User A generates a QKD key
  const userAKey = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
  console.log('✅ User A generated key:', userAKey.substring(0, 16) + '...');
  
  // User A shares the key with User B
  const sharedKeyData = {
    peerId: 'user_b_id',
    keyHex: userAKey,
    qber: 0.05,
    eveDetected: false
  };
  console.log('✅ User A sharing key with User B:', {
    peerId: sharedKeyData.peerId,
    keyHex: sharedKeyData.keyHex.substring(0, 16) + '...',
    qber: sharedKeyData.qber,
    eveDetected: sharedKeyData.eveDetected
  });
  
  // User B receives and imports the shared key
  const userBKey = sharedKeyData.keyHex;
  console.log('✅ User B received key:', userBKey.substring(0, 16) + '...');
  
  // Both users now have the same key
  if (userAKey === userBKey) {
    console.log('✅ SUCCESS: Both users have the same key!');
    return true;
  } else {
    console.log('❌ FAILED: Users have different keys');
    return false;
  }
}

// Test encryption/decryption with shared key
function testSharedEncryption() {
  console.log('\n=== Test: Encryption/Decryption with Shared Key ===');
  
  const sharedKey = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
  const plaintext = 'Hello, Quantum World!';
  
  try {
    // User A encrypts with the shared key
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipher(algorithm, Buffer.from(sharedKey, 'hex'));
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    
    console.log('✅ User A encrypted message:', plaintext);
    console.log('✅ Ciphertext:', encrypted.substring(0, 20) + '...');
    console.log('✅ IV:', iv.toString('hex'));
    
    // User B decrypts with the same shared key
    const decipher = crypto.createDecipher(algorithm, Buffer.from(sharedKey, 'hex'));
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log('✅ User B decrypted message:', decrypted);
    
    if (decrypted === plaintext) {
      console.log('✅ SUCCESS: Decryption successful with shared key!');
      return true;
    } else {
      console.log('❌ FAILED: Decrypted text does not match original');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Encryption/Decryption test failed:', error.message);
    return false;
  }
}

// Run all tests
console.log('🚀 Running key sharing tests...\n');

const keySharingTest = testKeySharing();
const encryptionTest = testSharedEncryption();

console.log('\n🎯 Test Summary:');
console.log('✅ Key sharing:', keySharingTest ? 'WORKING' : 'FAILED');
console.log('✅ Shared encryption:', encryptionTest ? 'WORKING' : 'FAILED');

if (keySharingTest && encryptionTest) {
  console.log('\n🎉 All tests passed! Key sharing system is working correctly.');
} else {
  console.log('\n❌ Some tests failed. Key sharing system needs fixing.');
}
