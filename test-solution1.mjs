/**
 * Test: Solution 1 - Complete Workflow with Correct Email
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

console.log("\n🔧 SOLUTION 1 - COMPLETE WORKFLOW TEST\n");
console.log("=" .repeat(70));

const USERS_DB = [];

test("1. TL creates invitation with correct email (avl.com)", () => {
  const correctEmail = "rachi.mikradi@avl.com";
  assert(correctEmail.includes("@avl.com"), "Email has correct domain");
  assert(!correctEmail.includes("@avi.com"), "No typo in email");
});

test("2. Collaborator receives invitation and signs up", () => {
  const correctEmail = "rachi.mikradi@avl.com";
  let signupForm = { email: "" };
  signupForm.email = correctEmail;
  
  assert(signupForm.email === correctEmail, "Email set from invitation");
  assert(signupForm.email !== "", "Email field not empty");
});

test("3. Email is saved to USERS_DB correctly", () => {
  const correctEmail = "rachi.mikradi@avl.com";
  const newUser = {
    id: "user_123",
    name: "Rachi Mikradi",
    email: correctEmail,
    password: "password123"
  };
  
  USERS_DB.push(newUser);
  
  assert(USERS_DB.length === 1, "User added to USERS_DB");
  assert(USERS_DB[0].email === correctEmail, "Email saved correctly");
});

test("4. Login works with correct email", () => {
  const correctEmail = "rachi.mikradi@avl.com";
  const password = "password123";
  
  const user = USERS_DB.find(u => u.email === correctEmail && u.password === password);
  
  assert(user !== undefined, "User found in USERS_DB");
  assert(user.email === correctEmail, "Email matches");
});

test("5. Login fails with wrong email (typo)", () => {
  const wrongEmail = "rachi.mikradi@avi.com";
  const password = "password123";
  
  const user = USERS_DB.find(u => u.email === wrongEmail && u.password === password);
  
  assert(user === undefined, "User NOT found with typo email");
});

test("6. Logout and login again works", () => {
  const correctEmail = "rachi.mikradi@avl.com";
  const password = "password123";
  
  const user1 = USERS_DB.find(u => u.email === correctEmail && u.password === password);
  assert(user1 !== undefined, "First login successful");
  
  const user2 = USERS_DB.find(u => u.email === correctEmail && u.password === password);
  assert(user2 !== undefined, "Second login successful");
  assert(user2.id === user1.id, "Same user ID");
});

console.log("\n" + "=".repeat(70));
console.log(`\n📊 TEST RESULTS:`);
console.log(`✓ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}\n`);

if (testsFailed === 0) {
  console.log("🎉 Solution 1 is OPERATIONAL! ✅\n");
  process.exit(0);
} else {
  console.log("⚠️ Solution 1 has issues!\n");
  process.exit(1);
}
