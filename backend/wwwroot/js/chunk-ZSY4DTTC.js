// tinylib/tinyhind-client.ts
var TinyHindClient = class {
  baseUrl;
  tenantId;
  // Make baseUrl optional and default to an empty string (for relative paths)
  constructor(baseUrl = "", tenantId) {
    this.baseUrl = baseUrl;
    this.tenantId = tenantId;
  }
  // async registerTable(tableName: keyof DbSchema, schema: object): Promise<string> {
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
      throw new Error(`[Get Record] Server respondedz with ${response.status}`);
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
  async getAllSchemas() {
    const response = await fetch(`${this.baseUrl}/rune/${this.tenantId}/schemas`);
    if (!response.ok) {
      throw new Error(`[Get All Schemas] Server responded with ${response.status}: ${await response.text()}`);
    }
    return response.json();
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

export {
  TinyHindClient,
  API_BASE_URL,
  TENANT_ID
};
