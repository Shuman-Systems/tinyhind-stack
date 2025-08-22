import {
  API_BASE_URL,
  TENANT_ID,
  TinyHindClient
} from "../js/chunk-ZSY4DTTC.js";

// pages/tinyhind/tinyhind.ts
var outputElement = document.getElementById("output");
var runTestsBtn = document.getElementById("run-tests-btn");
var tiny = new TinyHindClient(API_BASE_URL, TENANT_ID);
async function runTests() {
  outputElement.textContent = `Using static Tenant ID: ${TENANT_ID}

Running tests...
`;
  runTestsBtn.disabled = true;
  runTestsBtn.textContent = "Running...";
  try {
    outputElement.textContent += "\nStep 1: Registering 'Users' table...\n";
    const userSchema = {
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        age: { type: "integer" }
      },
      required: ["name", "email"]
    };
    const registerResult = await tiny.registerTable("Users", userSchema);
    outputElement.textContent += `SUCCESS: ${registerResult}

`;
    outputElement.textContent += "Step 2: Inserting a new user...\n";
    const newUser = { name: "Catherine", email: "catherine@example.com", age: 25 };
    const insertResult = await tiny.insertRecord("Users", newUser);
    const newId = insertResult.id;
    outputElement.textContent += `SUCCESS: Record created with ID: ${newId}

`;
    outputElement.textContent += `Step 3: Fetching user with ID ${newId}...
`;
    const fetchedUser = await tiny.getRecordById("Users", newId);
    outputElement.textContent += `SUCCESS: Fetched user data:
${JSON.stringify(fetchedUser, null, 2)}

`;
    outputElement.textContent += `Step 4: Updating user ${newId} with age 26...
`;
    const updatePayload = { age: 26 };
    const updateResult = await tiny.updateRecord("Users", newId, updatePayload);
    outputElement.textContent += `SUCCESS: ${updateResult}

`;
    outputElement.textContent += `Step 5: Re-fetching user ${newId} to verify age change...
`;
    const updatedUser = await tiny.getRecordById("Users", newId);
    outputElement.textContent += `SUCCESS: Fetched updated user data:
${JSON.stringify(updatedUser, null, 2)}

`;
    outputElement.textContent += `Step 6: Querying for user with email 'catherine@example.com'...
`;
    const userQuery = {
      from: "Users",
      select: ["Id", "name", "age"],
      where: {
        email: { eq: "catherine@example.com" }
      }
    };
    const queryResult = await tiny.queryRecords(userQuery);
    outputElement.textContent += `SUCCESS: Query found ${queryResult.length} record(s):
${JSON.stringify(queryResult, null, 2)}

`;
    outputElement.textContent += "All tests complete!";
  } catch (error) {
    outputElement.textContent += `
--- ERROR ---
${error.message}

`;
  } finally {
    runTestsBtn.disabled = false;
    runTestsBtn.textContent = "Run All Tests";
  }
}
function initialize() {
  outputElement.textContent = "Ready to run tests. Click the button to start.";
  runTestsBtn.onclick = runTests;
}
initialize();
