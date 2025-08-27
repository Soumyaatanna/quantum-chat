"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateBB84 = simulateBB84;
function randomBits(length) {
    return Array.from({ length }, () => (Math.random() < 0.5 ? 0 : 1));
}
function toHexFromBits(bits) {
    // Ensure we have at least 128 bits for a proper key
    if (bits.length < 128) {
        console.warn('[BB84] Warning: Generated key too short, padding with random bits');
        while (bits.length < 128) {
            bits.push(Math.random() < 0.5 ? 0 : 1);
        }
    }
    // Truncate to exactly 128 bits for consistency
    const keyBits = bits.slice(0, 128);
    // Convert bits to hex string
    let hexString = '';
    for (let i = 0; i < keyBits.length; i += 4) {
        let nibble = 0;
        for (let j = 0; j < 4 && i + j < keyBits.length; j++) {
            nibble = (nibble << 1) | keyBits[i + j];
        }
        hexString += nibble.toString(16);
    }
    // Ensure the hex string is exactly 32 characters (128 bits = 16 bytes = 32 hex chars)
    if (hexString.length !== 32) {
        console.warn('[BB84] Warning: Generated hex string length is', hexString.length, 'expected 32');
        // Pad or truncate to exactly 32 characters
        hexString = hexString.padEnd(32, '0').substring(0, 32);
    }
    console.log('[BB84] Generated key:', keyBits.length, 'bits, hex length:', hexString.length);
    console.log('[BB84] Hex string validation:', /^[0-9a-f]{32}$/.test(hexString) ? 'Valid' : 'Invalid');
    return hexString;
}
function simulateBB84(numPhotons, eveEnabled = false) {
    const steps = [];
    const aliceBits = randomBits(numPhotons);
    const aliceBases = randomBits(numPhotons); // 0: +, 1: x
    const bobBases = randomBits(numPhotons);
    steps.push({ name: 'Bit Generation', detail: 'Alice generates random bits', aliceBits });
    steps.push({ name: 'Basis Selection', detail: 'Alice and Bob choose random bases', aliceBases, bobBases });
    // Eve intercept-resend attack simulation
    const eveBases = eveEnabled ? randomBits(numPhotons) : undefined;
    const afterEveBits = [];
    for (let i = 0; i < numPhotons; i++) {
        let transmittedBit = aliceBits[i];
        if (eveEnabled && eveBases) {
            const eveMeasureBasis = eveBases[i];
            const eveMeasuredBit = aliceBases[i] === eveMeasureBasis ? aliceBits[i] : randomBits(1)[0];
            // resend in eve's basis with the bit she measured
            transmittedBit = eveMeasuredBit;
        }
        afterEveBits.push(transmittedBit);
    }
    const bobMeasurements = [];
    for (let i = 0; i < numPhotons; i++) {
        if (aliceBases[i] === bobBases[i]) {
            // same basis → get transmitted bit reliably
            bobMeasurements.push(afterEveBits[i]);
        }
        else {
            // different basis → random outcome
            bobMeasurements.push(randomBits(1)[0]);
        }
    }
    steps.push({ name: 'Transmission & Measurement', detail: 'Bob measures incoming photons', bobMeasurements });
    // Sifting: keep positions where bases matched
    const siftedKey = [];
    const siftedAlice = [];
    const siftedBob = [];
    for (let i = 0; i < numPhotons; i++) {
        if (aliceBases[i] === bobBases[i]) {
            siftedKey.push(aliceBits[i]);
            siftedAlice.push(aliceBits[i]);
            siftedBob.push(bobMeasurements[i]);
        }
    }
    // Estimate QBER on a sample (simplified: use all sifted)
    let errors = 0;
    for (let i = 0; i < siftedAlice.length; i++)
        if (siftedAlice[i] !== siftedBob[i])
            errors++;
    const qber = siftedAlice.length ? errors / siftedAlice.length : 0;
    const eveDetected = qber > 0.11; // illustrative threshold
    steps.push({ name: 'Sifting', detail: 'Keep bits where bases matched', siftedKey });
    steps.push({ name: 'QBER Estimation', detail: 'Compare subset to estimate error rate', qber, eveDetected });
    // Generate final key
    const keyHex = toHexFromBits(siftedKey);
    const finalBits = keyHex.match(/.{1,2}/g)?.map(x => parseInt(x, 16)) || [];
    return { keyBits: finalBits, keyHex, steps, qber, eveDetected };
}
