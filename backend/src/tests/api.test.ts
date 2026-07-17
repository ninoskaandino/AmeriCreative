import { dbService } from '../services/dbService.js';
import { bedrockTextService } from '../services/bedrockTextService.js';
import { bedrockImageService } from '../services/bedrockImageService.js';
import { clinicalContentReviewService } from '../services/clinicalContentReviewService.js';
import { moderationService } from '../services/moderationService.js';

console.log('🧪 Starting Automated Backend Service Tests...');

async function runTests() {
  let passed = true;

  // Test 1: Verify Seed Database
  try {
    const branches = dbService.branches;
    const users = dbService.users;
    const campaigns = dbService.campaigns;

    if (branches.length >= 9 && users.length >= 7 && campaigns.length >= 4) {
      console.log('✅ Test 1 Passed: Database seeded with branches, users, and campaigns.');
    } else {
      console.error('❌ Test 1 Failed: Seed numbers incorrect.');
      passed = false;
    }
  } catch (err) {
    console.error('❌ Test 1 Failed with error:', err);
    passed = false;
  }

  // Test 2: Verify Text Service Generation (Demo Mode)
  try {
    const response = await bedrockTextService.generateText({
      objective: 'Promover la ortodoncia invisible',
      audience: 'Adultos',
      specialty: 'Ortodoncia',
      treatment: 'Alineadores invisibles',
      channel: 'Instagram',
      tone: 'Premium',
      extension: 'Medio',
      language: 'Español'
    });

    if (response && response.includes('Amerident')) {
      console.log('✅ Test 2 Passed: Text Generation Service returned content.');
    } else {
      console.error('❌ Test 2 Failed: Text generation output invalid.');
      passed = false;
    }
  } catch (err) {
    console.error('❌ Test 2 Failed with error:', err);
    passed = false;
  }

  // Test 3: Verify Clinical Review Audit Scanner
  try {
    const unsafeText = '¡Garantizamos al 100% que tu tratamiento será totalmente sin dolor para siempre!';
    const review = await clinicalContentReviewService.reviewContent(unsafeText, 'Odontología general', 'Limpieza dental');

    if (!review.safe && review.issues.length > 0) {
      console.log('✅ Test 3 Passed: Clinical warning scanner successfully flagged absolute guarantees and pain claims.');
    } else {
      console.error('❌ Test 3 Failed: Clinical warnings were not flagged.');
      passed = false;
    }
  } catch (err) {
    console.error('❌ Test 3 Failed with error:', err);
    passed = false;
  }

  // Test 4: Verify Content Moderation Shield
  try {
    const piiText = 'Hola Juan Pérez, tu número de cédula es 001-1234567-8 y tu correo es juan@gmail.com';
    const scan = await moderationService.scanContent(piiText);

    if (!scan.approved) {
      console.log('✅ Test 4 Passed: Privacy shield successfully blocked personal patient data leaks.');
    } else {
      console.error('❌ Test 4 Failed: PII leaks were not detected.');
      passed = false;
    }
  } catch (err) {
    console.error('❌ Test 4 Failed with error:', err);
    passed = false;
  }

  // Test 5: Verify Image Service Stock Return (Demo Mode)
  try {
    const url = await bedrockImageService.generateImage({
      prompt: 'smiling kid holding huge toothbrush',
      specialty: 'Odontopediatría',
      audience: 'Niños',
      style: 'Infantil',
      format: 'Instagram 1:1'
    });

    if (url && url.startsWith('http')) {
      console.log('✅ Test 5 Passed: Image Service successfully resolved stock assets under Demo Mode.');
    } else {
      console.error('❌ Test 5 Failed: Image URL was not resolved.');
      passed = false;
    }
  } catch (err) {
    console.error('❌ Test 5 Failed with error:', err);
    passed = false;
  }

  console.log('\n======================================');
  if (passed) {
    console.log('🎉 ALL BACKEND SERVICE TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
