/**
 * Test: Invited User Login Workflow
 * Validates that invited users can create account and login after logout
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

// Mock USERS_DB
let USERS_DB = [];

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// Signup function
function createInvitedUser(signupForm, invitationData) {
  const initials = signupForm.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  // Use invitation email if signup email is empty (for invited users)
  const userEmail = signupForm.email || invitationData?.email || "";
  
  const newUser = {
    id: genId(),
    name: signupForm.name,
    initials,
    email: userEmail,
    password: signupForm.password,
    role: signupForm.role,
    color: signupForm.color,
    department: signupForm.department || "General",
    team: signupForm.team,
    joinDate: today(),
    collabId: signupForm.role === "Collaborator" ? genId() : null,
    invitationToken: invitationData?.token || null
  };
  
  USERS_DB.push(newUser);
  return newUser;
}

// Login function
function loginUser(email, password) {
  const user = USERS_DB.find(u => u.email === email && u.password === password);
  return user || null;
}

// Tests
console.log("\n👤 INVITED USER LOGIN WORKFLOW TESTS\n");
console.log("=" .repeat(60));

test("1. Invited user signup with empty email field", () => {
  USERS_DB = [];
  
  const signupForm = {
    name: "John Doe",
    email: "", // Empty - will use invitation email
    password: "password123",
    role: "Collaborator",
    color: "#64B4DC",
    department: "ESW",
    team: "EE"
  };
  
  const invitationData = {
    token: "invite_token_123",
    email: "john.doe@avl.com",
    subprojectId: "sp1",
    tlId: "tl1"
  };
  
  const newUser = createInvitedUser(signupForm, invitationData);
  
  assert(newUser.email === "john.doe@avl.com", "Email set from invitation");
  assert(newUser.email !== "", "Email is not empty");
  assert(newUser.invitationToken === "invite_token_123", "Invitation token saved");
  assert(USERS_DB.length === 1, "User added to USERS_DB");
});

test("2. Invited user can login after signup", () => {
  USERS_DB = [];
  
  const signupForm = {
    name: "Jane Smith",
    email: "",
    password: "securePass456",
    role: "Collaborator",
    color: "#00A8CC",
    department: "VSP",
    team: "CT1"
  };
  
  const invitationData = {
    token: "invite_token_456",
    email: "jane.smith@avl.com"
  };
  
  // Signup
  const newUser = createInvitedUser(signupForm, invitationData);
  
  // Logout (simulate)
  // Try to login
  const loginAttempt = loginUser("jane.smith@avl.com", "securePass456");
  
  assert(loginAttempt !== null, "User found in USERS_DB");
  assert(loginAttempt.email === "jane.smith@avl.com", "Email matches");
  assert(loginAttempt.name === "Jane Smith", "Name matches");
  assert(loginAttempt.id === newUser.id, "Same user ID");
});

test("3. Invited user login fails with wrong password", () => {
  USERS_DB = [];
  
  const signupForm = {
    name: "Bob Wilson",
    email: "",
    password: "correctPassword789",
    role: "Collaborator",
    color: "#2E5EAA",
    department: "MDS",
    team: "SD"
  };
  
  const invitationData = {
    token: "invite_token_789",
    email: "bob.wilson@avl.com"
  };
  
  createInvitedUser(signupForm, invitationData);
  
  const loginAttempt = loginUser("bob.wilson@avl.com", "wrongPassword");
  
  assert(loginAttempt === null, "Login fails with wrong password");
});

test("4. Invited user login fails with wrong email", () => {
  USERS_DB = [];
  
  const signupForm = {
    name: "Alice Brown",
    email: "",
    password: "password999",
    role: "Collaborator",
    color: "#1DD3B0",
    department: "ESW",
    team: "DAI"
  };
  
  const invitationData = {
    token: "invite_token_999",
    email: "alice.brown@avl.com"
  };
  
  createInvitedUser(signupForm, invitationData);
  
  const loginAttempt = loginUser("wrong.email@avl.com", "password999");
  
  assert(loginAttempt === null, "Login fails with wrong email");
});

test("5. Multiple invited users can have different emails", () => {
  USERS_DB = [];
  
  const user1 = createInvitedUser(
    { name: "User One", email: "", password: "pass1", role: "Collaborator", color: "#00A8CC", department: "ESW", team: "EE" },
    { token: "token1", email: "user1@avl.com" }
  );
  
  const user2 = createInvitedUser(
    { name: "User Two", email: "", password: "pass2", role: "Collaborator", color: "#00A8CC", department: "VSP", team: "CT1" },
    { token: "token2", email: "user2@avl.com" }
  );
  
  const user3 = createInvitedUser(
    { name: "User Three", email: "", password: "pass3", role: "Collaborator", color: "#00A8CC", department: "MDS", team: "SD" },
    { token: "token3", email: "user3@avl.com" }
  );
  
  assert(USERS_DB.length === 3, "All 3 users in database");
  assert(user1.email === "user1@avl.com", "User 1 email correct");
  assert(user2.email === "user2@avl.com", "User 2 email correct");
  assert(user3.email === "user3@avl.com", "User 3 email correct");
});

test("6. Each invited user can login independently", () => {
  USERS_DB = [];
  
  const user1 = createInvitedUser(
    { name: "Alice", email: "", password: "alice123", role: "Collaborator", color: "#00A8CC", department: "ESW", team: "EE" },
    { token: "token_alice", email: "alice@avl.com" }
  );
  
  const user2 = createInvitedUser(
    { name: "Bob", email: "", password: "bob456", role: "Collaborator", color: "#00A8CC", department: "VSP", team: "CT1" },
    { token: "token_bob", email: "bob@avl.com" }
  );
  
  const aliceLogin = loginUser("alice@avl.com", "alice123");
  const bobLogin = loginUser("bob@avl.com", "bob456");
  
  assert(aliceLogin !== null, "Alice can login");
  assert(bobLogin !== null, "Bob can login");
  assert(aliceLogin.name === "Alice", "Alice's data correct");
  assert(bobLogin.name === "Bob", "Bob's data correct");
  assert(aliceLogin.id !== bobLogin.id, "Different user IDs");
});

test("7. Non-invited user signup with email still works", () => {
  USERS_DB = [];
  
  const signupForm = {
    name: "Charlie Davis",
    email: "charlie@avl.com", // Email provided (not invited)
    password: "charliePwd",
    role: "Collaborator",
    color: "#00A8CC",
    department: "ESW",
    team: "SW Coding"
  };
  
  const newUser = createInvitedUser(signupForm, null); // No invitation
  
  assert(newUser.email === "charlie@avl.com", "Email from signup form used");
  assert(newUser.invitationToken === null, "No invitation token");
  
  const loginAttempt = loginUser("charlie@avl.com", "charliePwd");
  assert(loginAttempt !== null, "Non-invited user can login");
});

test("8. Complete workflow: signup → logout → login", () => {
  USERS_DB = [];
  
  // Step 1: Signup via invitation
  const signupForm = {
    name: "Diana Evans",
    email: "",
    password: "dianaSecure789",
    role: "Collaborator",
    color: "#00A8CC",
    department: "MDS",
    team: "MS"
  };
  
  const invitationData = {
    token: "final_token",
    email: "diana.evans@avl.com"
  };
  
  const newUser = createInvitedUser(signupForm, invitationData);
  assert(newUser.email === "diana.evans@avl.com", "Step 1: User created with invitation email");
  
  // Step 2: Logout (simulated - just clear session)
  // Step 3: Login
  const loginAttempt = loginUser("diana.evans@avl.com", "dianaSecure789");
  assert(loginAttempt !== null, "Step 3: User can login after logout");
  assert(loginAttempt.name === "Diana Evans", "Step 3: Correct user data retrieved");
});

// Summary
console.log("\n" + "=".repeat(60));
console.log(`\n📊 TEST RESULTS:`);
console.log(`✓ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}\n`);

if (testsFailed === 0) {
  console.log("🎉 All invited user login tests passed!\n");
  process.exit(0);
} else {
  console.log("⚠️ Some tests failed!\n");
  process.exit(1);
}
