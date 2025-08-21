// In src/main.ts
import { TinyHindClient } from './tinyhind-client';
import { DbSchema, Query } from './api-types';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5087';
const TENANT_ID = 'd95cc89b-e287-47d0-996a-508df06d520f';
const outputElement = document.getElementById('output')!;

// --- Main Test Runner ---
async function runTests() {
    outputElement.textContent = `Using static Tenant ID: ${TENANT_ID}\n\n`;
    
    // Create an instance of our new client
    const tiny = new TinyHindClient(API_BASE_URL, TENANT_ID);

    try {
        // --- Test 1: Register a 'Users' table ---
        outputElement.textContent += "Step 1: Registering 'Users' table...\n";
        const userSchema = {
            properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                age: { type: 'integer' }
            },
            required: ['name', 'email']
        };
        const registerResult = await tiny.registerTable('Users', userSchema);
        outputElement.textContent += `SUCCESS: ${registerResult}\n\n`;

        // --- Test 2: Insert a new user ---
        outputElement.textContent += "Step 2: Inserting a new user...\n";
        const newUser: Partial<DbSchema['Users']> = { name: 'Catherine', email: 'catherine@example.com', age: 25 };
        const insertResult = await tiny.insertRecord('Users', newUser);
        const newId = insertResult.id;
        outputElement.textContent += `SUCCESS: Record created with ID: ${newId}\n\n`;
        
        // --- Test 3: Fetch the new user by ID ---
        outputElement.textContent += `Step 3: Fetching user with ID ${newId}...\n`;
        const fetchedUser = await tiny.getRecordById('Users', newId);
        outputElement.textContent += `SUCCESS: Fetched user data:\n${JSON.stringify(fetchedUser, null, 2)}\n\n`;
        
        // --- Test 4: Update the user's age ---
        outputElement.textContent += `Step 4: Updating user ${newId} with age 26...\n`;
        const updatePayload = { age: 26 };
        const updateResult = await tiny.updateRecord('Users', newId, updatePayload);
        outputElement.textContent += `SUCCESS: ${updateResult}\n\n`;

        // --- Test 5: Fetch the user again to confirm the update ---
        outputElement.textContent += `Step 5: Re-fetching user ${newId} to verify age change...\n`;
        const updatedUser = await tiny.getRecordById('Users', newId);
        outputElement.textContent += `SUCCESS: Fetched updated user data:\n${JSON.stringify(updatedUser, null, 2)}\n\n`;

        // --- Test 6: Query for the user ---
        outputElement.textContent += `Step 6: Querying for user with email 'catherine@example.com'...\n`;
        const userQuery: Query<'Users'> = {
            from: 'Users',
            select: ['Id', 'name', 'age'],
            where: {
                email: { eq: 'catherine@example.com' }
            }
        };
        const queryResult = await tiny.queryRecords(userQuery);
        outputElement.textContent += `SUCCESS: Query found ${queryResult.length} record(s):\n${JSON.stringify(queryResult, null, 2)}\n\n`;

        outputElement.textContent += "All tests complete!";

    } catch (error: any) {
        outputElement.textContent += `\n--- ERROR ---\n${error.message}\n\n`;
    }
}

runTests();