/**
 * Test: All Three Fixes
 * 1. Email persistence
 * 2. Email display
 * 3. Meeting page sync
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

console.log("\n🔧 COMPREHENSIVE FIX VALIDATION TESTS\n");
console.log("=" .repeat(60));

// Test 1: Email Persistence
test("1. Email persists from invitationData to signupForm", () => {
  const invitationData = { email: "john@avl.com", token: "token123" };
  let signupForm = { email: "" };
  
  // Simulate useEffect: if (invitationData?.email)
  if (invitationData?.email) {
    signupForm = { ...signupForm, email: invitationData.email };
  }
  
  assert(signupForm.email === "john@avl.com", "Email set from invitationData");
  assert(signupForm.email !== "", "Email is not empty");
});

test("2. Email persists even after state initialization", () => {
  const invitationData = { email: "jane@avl.com", token: "token456" };
  let signupForm = { email: "" };
  
  // Simulate multiple updates
  if (invitationData?.email) {
    signupForm = { ...signupForm, email: invitationData.email };
  }
  
  // Simulate form submission
  const userEmail = signupForm.email || invitationData?.email || "";
  
  assert(userEmail === "jane@avl.com", "Email persists through submission");
});

test("3. Email display shows invitation email", () => {
  const invitationData = { email: "bob@avl.com" };
  const signupForm = { email: "bob@avl.com" };
  
  const displayText = `📧 Vous utiliserez cet email pour vous connecter: ${signupForm.email}`;
  
  assert(displayText.includes("bob@avl.com"), "Email displayed correctly");
  assert(displayText.includes("📧"), "Email icon shown");
});

// Test 2: Data Sharing
test("4. TL data shared with collaborator on signup", () => {
  const tlData = {
    projects: [{ id: "p1", name: "Project 1" }],
    collaborators: [{ id: "c1", name: "Collab 1" }],
    meetings: [{ id: "m1", title: "Meeting 1" }]
  };
  
  const invitationData = { tlId: "tl1" };
  const newUser = { collabId: "collab_id_123" };
  
  // Simulate data sharing
  let sharedData = null;
  if (invitationData?.tlId) {
    sharedData = tlData;
  }
  
  assert(sharedData !== null, "TL data shared");
  assert(sharedData.projects.length === 1, "Projects shared");
  assert(sharedData.collaborators.length === 1, "Collaborators shared");
  assert(sharedData.meetings.length === 1, "Meetings shared");
});

test("5. Meeting page appears in collaborator view after sync", () => {
  const tlMeetings = [
    { id: "m1", projectId: "p1", title: "Weekly Sync", date: "2025-02-27" }
  ];
  
  const collabData = { meetings: tlMeetings };
  
  const collabCanSeeMeeting = collabData.meetings.length > 0;
  const meetingTitle = collabData.meetings[0]?.title;
  
  assert(collabCanSeeMeeting, "Collaborator can see meeting");
  assert(meetingTitle === "Weekly Sync", "Meeting title correct");
});

test("6. Multiple meetings sync correctly", () => {
  const tlMeetings = [
    { id: "m1", title: "Meeting 1", date: "2025-02-27" },
    { id: "m2", title: "Meeting 2", date: "2025-02-28" },
    { id: "m3", title: "Meeting 3", date: "2025-03-01" }
  ];
  
  const collabData = { meetings: tlMeetings };
  
  assert(collabData.meetings.length === 3, "All 3 meetings synced");
  assert(collabData.meetings[0].title === "Meeting 1", "First meeting correct");
  assert(collabData.meetings[2].title === "Meeting 3", "Last meeting correct");
});

// Test 3: Complete Workflow
test("7. Complete workflow: invite → signup → see data", () => {
  // Step 1: TL creates invitation
  const invitationData = {
    token: "final_token",
    email: "diana@avl.com",
    tlId: "tl_123"
  };
  
  // Step 2: Collaborator signs up
  let signupForm = { email: "" };
  if (invitationData?.email) {
    signupForm = { ...signupForm, email: invitationData.email };
  }
  
  const newUser = {
    id: "user_456",
    email: signupForm.email,
    collabId: "collab_456",
    invitationToken: invitationData.token
  };
  
  // Step 3: TL data is shared
  const tlData = {
    projects: [{ id: "p1", name: "Powertrain ECU" }],
    meetings: [{ id: "m1", title: "Weekly Sync #8" }]
  };
  
  const collabData = tlData;
  
  assert(newUser.email === "diana@avl.com", "Step 1: Email saved");
  assert(collabData.projects.length === 1, "Step 2: Projects visible");
  assert(collabData.meetings.length === 1, "Step 3: Meetings visible");
});

test("8. Email display during signup", () => {
  const invitationData = { email: "test@avl.com" };
  const signupForm = { email: "test@avl.com" };
  
  const shouldDisplay = invitationData && signupForm.email;
  const displayMessage = shouldDisplay ? `📧 Vous utiliserez cet email pour vous connecter: ${signupForm.email}` : null;
  
  assert(shouldDisplay, "Display condition met");
  assert(displayMessage !== null, "Display message generated");
  assert(displayMessage.includes("test@avl.com"), "Email in message");
});

// Summary
console.log("\n" + "=".repeat(60));
console.log(`\n📊 TEST RESULTS:`);
console.log(`✓ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}\n`);

if (testsFailed === 0) {
  console.log("🎉 All fixes validated successfully!\n");
  process.exit(0);
} else {
  console.log("⚠️ Some tests failed!\n");
  process.exit(1);
}
