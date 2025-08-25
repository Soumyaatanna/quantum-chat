export type BB84Step = {
  name: string;
  detail: string;
  aliceBits?: number[];
  aliceBases?: number[];
  bobBases?: number[];
  bobMeasurements?: number[];
  siftedKey?: number[];
  qber?: number;
  eveDetected?: boolean;
};

export interface BB84Result {
  keyBits: number[];
  keyHex: string;
  steps: BB84Step[];
  qber: number;
  eveDetected: boolean;
}

function randomBits(length: number): number[] {
  return Array.from({ length }, () => (Math.random() < 0.5 ? 0 : 1));
}

function toHexFromBits(bits: number[]): string {
  // pack bits to bytes
  const padded = bits.slice();
  while (padded.length % 8 !== 0) padded.push(0);
  const bytes = [] as number[];
  for (let i = 0; i < padded.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | padded[i + j];
    bytes.push(b);
  }
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function simulateBB84(numPhotons: number, eveEnabled: boolean = false): BB84Result {
  const steps: BB84Step[] = [];
  const aliceBits = randomBits(numPhotons);
  const aliceBases = randomBits(numPhotons); // 0: +, 1: x
  const bobBases = randomBits(numPhotons);

  steps.push({ name: 'Bit Generation', detail: 'Alice generates random bits', aliceBits });
  steps.push({ name: 'Basis Selection', detail: 'Alice and Bob choose random bases', aliceBases, bobBases });

  // Eve intercept-resend attack simulation
  const eveBases = eveEnabled ? randomBits(numPhotons) : undefined;
  const afterEveBits: number[] = [];
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

  const bobMeasurements: number[] = [];
  for (let i = 0; i < numPhotons; i++) {
    if (aliceBases[i] === bobBases[i]) {
      // same basis → get transmitted bit reliably
      bobMeasurements.push(afterEveBits[i]);
    } else {
      // different basis → random outcome
      bobMeasurements.push(randomBits(1)[0]);
    }
  }

  steps.push({ name: 'Transmission & Measurement', detail: 'Bob measures incoming photons', bobMeasurements });

  // Sifting: keep positions where bases matched
  const siftedKey: number[] = [];
  const siftedAlice: number[] = [];
  const siftedBob: number[] = [];
  for (let i = 0; i < numPhotons; i++) {
    if (aliceBases[i] === bobBases[i]) {
      siftedKey.push(aliceBits[i]);
      siftedAlice.push(aliceBits[i]);
      siftedBob.push(bobMeasurements[i]);
    }
  }

  // Estimate QBER on a sample (simplified: use all sifted)
  let errors = 0;
  for (let i = 0; i < siftedAlice.length; i++) if (siftedAlice[i] !== siftedBob[i]) errors++;
  const qber = siftedAlice.length ? errors / siftedAlice.length : 0;
  const eveDetected = qber > 0.11; // illustrative threshold

  steps.push({ name: 'Sifting', detail: 'Keep bits where bases matched', siftedKey });
  steps.push({ name: 'QBER Estimation', detail: 'Compare subset to estimate error rate', qber, eveDetected });

  // Simple privacy amplification: truncate to 128 bits if longer
  const finalBits = siftedKey.slice(0, Math.min(256, siftedKey.length));
  const keyHex = toHexFromBits(finalBits);

  return { keyBits: finalBits, keyHex, steps, qber, eveDetected };
}


