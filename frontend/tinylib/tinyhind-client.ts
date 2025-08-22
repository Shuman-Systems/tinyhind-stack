// In src/tinyhind-client.ts
import { DbSchema, Query } from './api-types';

export class TinyHindClient {
    private readonly baseUrl: string;
    private readonly tenantId: string;

    // Make baseUrl optional and default to an empty string (for relative paths)
    constructor(baseUrl: string = '', tenantId: string) {
        this.baseUrl = baseUrl;
        this.tenantId = tenantId;
    }

   // async registerTable(tableName: keyof DbSchema, schema: object): Promise<string> {
    async registerTable(tableName: string, schema: object): Promise<string> {
        const response = await fetch(`${this.baseUrl}/rune/${this.tenantId}/register/${tableName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(schema)
        });
        if (!response.ok) {
            throw new Error(`[Register Table] Server responded with ${response.status}: ${await response.text()}`);
        }
        return response.text();
    }

    async insertRecord<T extends keyof DbSchema>(tableName: T, record: Partial<DbSchema[T]>): Promise<{ id: number }> {
        const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/${tableName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        if (!response.ok) {
            throw new Error(`[Insert Record] Server responded with ${response.status}`);
        }
        return response.json();
    }

    async getRecordById<T extends keyof DbSchema>(tableName: T, id: number): Promise<DbSchema[T]> {
        const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/${tableName}/${id}`);
        if (!response.ok) {
            throw new Error(`[Get Record] Server respondedz with ${response.status}`);
        }
        return response.json();
    }

    async updateRecord<T extends keyof DbSchema>(tableName: T, id: number, record: Partial<DbSchema[T]>): Promise<string> {
        const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/${tableName}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        if (!response.ok) {
            throw new Error(`[Update Record] Server responded with ${response.status}`);
        }
        return response.text();
    }

    async deleteRecord<T extends keyof DbSchema>(tableName: T, id: number): Promise<string> {
        const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/${tableName}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`[Delete Record] Server responded with ${response.status}`);
        }
        return response.text();
    }

    
    async getAllSchemas(): Promise<Record<string, any[]>> {
        const response = await fetch(`${this.baseUrl}/rune/${this.tenantId}/schemas`);
        if (!response.ok) {
            throw new Error(`[Get All Schemas] Server responded with ${response.status}: ${await response.text()}`);
        }
        return response.json();
    }

    async queryRecords<T extends keyof DbSchema>(queryObject: Query<T>): Promise<DbSchema[T][]> {
        const response = await fetch(`${this.baseUrl}/call/${this.tenantId}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queryObject)
        });
        if (!response.ok) {
            throw new Error(`[Query Records] Server responded with ${response.status}`);
        }
        return response.json();
    }
}