/**
 * Test: Email Field Validation for Invited Users
 * Validates that email field is excluded from validation when user is invited
 */

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

// Validation logic
function validateSignup(signupForm, invitationData) {
  // If invited, email is auto-filled so skip email validation
  const emailRequired = !invitationData;
  if (!signupForm.name || (emailRequired && !signupForm.email) || !signupForm.password || !signupForm.team) {
    return { valid: false, error: "Tous les champs obligatoires doivent être remplis" };
  }
  if (signupForm.password !== signupForm.confirmPassword) {
    return { valid: false, error: "Les mots de passe ne correspondent pas" };
  }
  if (signupForm.password.length < 6) {
    return { valid: false, error: "Le mot de passe doit contenir au moins 6 caractères" };
  }
  return { valid: true };
}

// Tests
console.log("\n📧 EMAIL VALIDATION TESTS FOR INVITED USERS\n");
console.log("=" .repeat(60));

test("1. Non-invited user: email is required", () => {
  const signupForm = {
    name: "John Doe",
    email: "", // Empty email
    password: "password123",
    confirmPassword: "password123",
    team: "EE"
  };
  const invitationData = null;
  
  const result = validateSignup(signupForm, invitationData);
  assert(!result.valid, "Validation fails with empty email");
  assert(result.error.includes("obligatoires"), "Error message about required fields");
});

test("2. Non-invited user: email provided", () => {
  const signupForm = {
    name: "John Doe",
    email: "john@avl.com",
    password: "password123",
    confirmPassword: "password123",
    team: "EE"
  };
  const invitationData = null;
  
  const result = validateSignup(signupForm, invitationData);
  assert(result.valid, "Validation passes with email provided");
});

test("3. Invited user: email can be empty (auto-filled)", () => {
  const signupForm = {
    name: "Jane Doe",
    email: "", // Empty email (will be filled by invitation)
    password: "password123",
    confirmPassword: "password123",
    team: "SW"
  };
  const invitationData = { token: "abc123", email: "jane@avl.com" };
  
  const result = validateSignup(signupForm, invitationData);
  assert(result.valid, "Validation passes even with empty email when invited");
});

test("4. Invited user: email pre-filled from invitation", () => {
  const signupForm = {
    name: "Bob Smith",
    email: "bob@avl.com", // Pre-filled from invitation
    password: "password123",
    confirmPassword: "password123",
    team: "DAI"
  };
  const invitationData = { token: "xyz789", email: "bob@avl.com" };
  
  const result = validateSignup(signupForm, invitationData);
  assert(result.valid, "Validation passes with pre-filled email");
});

test("5. Invited user: missing name still fails", () => {
  const signupForm = {
    name: "", // Missing name
    email: "user@avl.com",
    password: "password123",
    confirmPassword: "password123",
    team: "EE"
  };
  const invitationData = { token: "token123", email: "user@avl.com" };
  
  const result = validateSignup(signupForm, invitationData);
  assert(!result.valid, "Validation fails with missing name");
});

test("6. Invited user: missing password still fails", () => {
  const signupForm = {
    name: "Alice",
    email: "alice@avl.com",
    password: "", // Missing password
    confirmPassword: "",
    team: "SMBD"
  };
  const invitationData = { token: "token456", email: "alice@avl.com" };
  
  const result = validateSignup(signupForm, invitationData);
  assert(!result.valid, "Validation fails with missing password");
});

test("7. Invited user: missing team still fails", () => {
  const signupForm = {
    name: "Charlie",
    email: "charlie@avl.com",
    password: "password123",
    confirmPassword: "password123",
    team: "" // Missing team
  };
  const invitationData = { token: "token789", email: "charlie@avl.com" };
  
  const result = validateSignup(signupForm, invitationData);
  assert(!result.valid, "Validation fails with missing team");
});

test("8. Password mismatch fails for invited user", () => {
  const signupForm = {
    name: "Diana",
    email: "diana@avl.com",
    password: "password123",
    confirmPassword: "password456", // Mismatch
    team: "CT1"
  };
  const invitationData = { token: "token999", email: "diana@avl.com" };
  
  const result = validateSignup(signupForm, invitationData);
  assert(!result.valid, "Validation fails with password mismatch");
  assert(result.error.includes("correspondent pas"), "Error about password mismatch");
});

test("9. Short password fails for invited user", () => {
  const signupForm = {
    name: "Eve",
    email: "eve@avl.com",
    password: "123", // Too short
    confirmPassword: "123",
    team: "SD1"
  };
  const invitationData = { token: "token111", email: "eve@avl.com" };
  
  const result = validateSignup(signupForm, invitationData);
  assert(!result.valid, "Validation fails with short password");
  assert(result.error.includes("6 caractères"), "Error about password length");
});

test("10. Complete valid signup for invited user", () => {
  const signupForm = {
    name: "Frank Johnson",
    email: "frank@avl.com",
    password: "securePassword123",
    confirmPassword: "securePassword123",
    team: "VAH"
  };
  const invitationData = { token: "finalToken", email: "frank@avl.com" };
  
  const result = validateSignup(signupForm, invitationData);
  assert(result.valid, "Validation passes for complete valid signup");
});

// Summary
console.log("\n" + "=".repeat(60));
console.log(`\n📊 TEST RESULTS:`);
console.log(`✓ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}\n`);

if (testsFailed === 0) {
  console.log("🎉 All email validation tests passed!\n");
  process.exit(0);
} else {
  console.log("⚠️ Some tests failed!\n");
  process.exit(1);
}
