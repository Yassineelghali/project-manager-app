/**
 * Test: Invitation Token Persistence
 * Validates localStorage persistence of invitation tokens
 */

// Mock localStorage
const mockLocalStorage = {};

const localStorageMock = {
  getItem: (key) => mockLocalStorage[key] || null,
  setItem: (key, value) => { mockLocalStorage[key] = value; },
  removeItem: (key) => { delete mockLocalStorage[key]; },
  clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
};

// Mock functions with localStorage
let INVITATION_TOKENS = {};

function initializeInvitationTokens() {
  try {
    const stored = localStorageMock.getItem('invitation_tokens');
    if (stored) {
      INVITATION_TOKENS = JSON.parse(stored);
    }
  } catch (e) {
    INVITATION_TOKENS = {};
  }
}

function persistInvitationTokens() {
  try {
    localStorageMock.setItem('invitation_tokens', JSON.stringify(INVITATION_TOKENS));
  } catch (e) {
    console.error('Failed to save invitation tokens:', e);
  }
}

function generateInvitationToken() {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
}

function createInvitationToken(email, subprojectId, tlId) {
  const token = generateInvitationToken();
  INVITATION_TOKENS[token] = {
    email,
    subprojectId,
    tlId,
    createdAt: new Date().toISOString(),
    acceptedAt: null
  };
  persistInvitationTokens();
  return token;
}

function getInvitationByToken(token) {
  return INVITATION_TOKENS[token] || null;
}

function acceptInvitation(token) {
  if (INVITATION_TOKENS[token]) {
    INVITATION_TOKENS[token].acceptedAt = new Date().toISOString();
    persistInvitationTokens();
    return true;
  }
  return false;
}

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    testsFailed++;
    throw new Error(message);
  } else {
    console.log(`✓ ${message}`);
    testsPassed++;
  }
}

function test(name, fn) {
  try {
    console.log(`\n📋 Test: ${name}`);
    fn();
  } catch (e) {
    // Already logged
  }
}

// Tests
console.log("\n💾 INVITATION TOKEN PERSISTENCE TESTS\n");
console.log("=" .repeat(60));

test("1. Token is saved to localStorage", () => {
  localStorageMock.clear();
  INVITATION_TOKENS = {};
  
  const token = createInvitationToken("test@avl.com", "sp1", "tl1");
  const stored = localStorageMock.getItem('invitation_tokens');
  
  assert(stored !== null, "Token saved to localStorage");
  const parsed = JSON.parse(stored);
  assert(parsed[token] !== undefined, "Token found in stored data");
});

test("2. Token persists after reload", () => {
  localStorageMock.clear();
  INVITATION_TOKENS = {};
  
  // Create and save token
  const token1 = createInvitationToken("user1@avl.com", "sp1", "tl1");
  
  // Simulate page reload - clear memory but keep localStorage
  INVITATION_TOKENS = {};
  
  // Reload from localStorage
  initializeInvitationTokens();
  
  const invitation = getInvitationByToken(token1);
  assert(invitation !== null, "Token retrieved after reload");
  assert(invitation.email === "user1@avl.com", "Email preserved");
});

test("3. Multiple tokens persist", () => {
  localStorageMock.clear();
  INVITATION_TOKENS = {};
  
  const token1 = createInvitationToken("user1@avl.com", "sp1", "tl1");
  const token2 = createInvitationToken("user2@avl.com", "sp2", "tl1");
  const token3 = createInvitationToken("user3@avl.com", "sp3", "tl2");
  
  // Reload
  INVITATION_TOKENS = {};
  initializeInvitationTokens();
  
  assert(getInvitationByToken(token1) !== null, "Token 1 persisted");
  assert(getInvitationByToken(token2) !== null, "Token 2 persisted");
  assert(getInvitationByToken(token3) !== null, "Token 3 persisted");
});

test("4. Accepted status persists", () => {
  localStorageMock.clear();
  INVITATION_TOKENS = {};
  
  const token = createInvitationToken("accepted@avl.com", "sp1", "tl1");
  
  // Accept invitation
  acceptInvitation(token);
  
  // Reload
  INVITATION_TOKENS = {};
  initializeInvitationTokens();
  
  const invitation = getInvitationByToken(token);
  assert(invitation.acceptedAt !== null, "Accepted status persisted");
});

test("5. Cannot retrieve invalid token after reload", () => {
  localStorageMock.clear();
  INVITATION_TOKENS = {};
  
  createInvitationToken("valid@avl.com", "sp1", "tl1");
  
  // Reload
  INVITATION_TOKENS = {};
  initializeInvitationTokens();
  
  const invitation = getInvitationByToken("invalid_token");
  assert(invitation === null, "Invalid token returns null");
});

test("6. Complete workflow with persistence", () => {
  localStorageMock.clear();
  INVITATION_TOKENS = {};
  
  // Step 1: TL creates invitation
  const token = createInvitationToken("workflow@avl.com", "sp1", "tl1");
  assert(INVITATION_TOKENS[token] !== undefined, "Step 1: Token created");
  
  // Step 2: Page reload (simulating user sharing link)
  INVITATION_TOKENS = {};
  initializeInvitationTokens();
  
  const invitation = getInvitationByToken(token);
  assert(invitation !== null, "Step 2: Token found after reload");
  assert(invitation.acceptedAt === null, "Step 2: Not yet accepted");
  
  // Step 3: Collaborator accepts
  acceptInvitation(token);
  
  // Step 4: Another reload
  INVITATION_TOKENS = {};
  initializeInvitationTokens();
  
  const finalInvitation = getInvitationByToken(token);
  assert(finalInvitation.acceptedAt !== null, "Step 4: Accepted status persisted");
});

// Summary
console.log("\n" + "=".repeat(60));
console.log(`\n📊 TEST RESULTS:`);
console.log(`✓ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}\n`);

if (testsFailed === 0) {
  console.log("🎉 All persistence tests passed!\n");
  process.exit(0);
} else {
  console.log("⚠️ Some tests failed!\n");
  process.exit(1);
}
