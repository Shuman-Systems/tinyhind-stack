(() => {
  // tinylib/tinyhind-client.ts
  var TinyHindClient = class {
    baseUrl;
    tenantId;
    // Make baseUrl optional and default to an empty string (for relative paths)
    constructor(baseUrl = "", tenantId) {
      this.baseUrl = baseUrl;
      this.tenantId = tenantId;
    }
    async registerTable(tableName, schema) {
      const response = await fetch(`${this.baseUrl}/rune/${this.tenantId}/register/${tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schema)
      });
      if (!response.ok) {
        throw new Error(`[Register Table] Server responded with ${response.status}: ${await response.text()}`);
      }
      return response.text();
    }
    async insertRecord(tableName, record) {
      const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/${tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
      if (!response.ok) {
        throw new Error(`[Insert Record] Server responded with ${response.status}`);
      }
      return response.json();
    }
    async getRecordById(tableName, id) {
      const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/${tableName}/${id}`);
      if (!response.ok) {
        throw new Error(`[Get Record] Server responded with ${response.status}`);
      }
      return response.json();
    }
    async updateRecord(tableName, id, record) {
      const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/${tableName}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
      if (!response.ok) {
        throw new Error(`[Update Record] Server responded with ${response.status}`);
      }
      return response.text();
    }
    async deleteRecord(tableName, id) {
      const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/${tableName}/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error(`[Delete Record] Server responded with ${response.status}`);
      }
      return response.text();
    }
    async queryRecords(queryObject) {
      const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryObject)
      });
      if (!response.ok) {
        throw new Error(`[Query Records] Server responded with ${response.status}`);
      }
      return response.json();
    }
  };

  // config.ts
  var API_BASE_URL = "";
  var TENANT_ID = "d267ccff-5c9c-42f2-a2b9-d2bc02519a5e";

  // pages/tinyhind/tinyhind.ts
  var outputElement = document.getElementById("output");
  async function runTests() {
    outputElement.textContent = `Using static Tenant ID: ${TENANT_ID}

`;
    const tiny = new TinyHindClient(API_BASE_URL, TENANT_ID);
    try {
      outputElement.textContent += "Step 1: Registering 'Users' table...\n";
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
    }
  }
  runTests();
})();
