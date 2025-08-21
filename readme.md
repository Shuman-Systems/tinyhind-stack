# <p align="center">🦌 TinyHind</p>
<p align="center">A brutally minimalist stack for building persistent web apps.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-.NET-8B4513?style=for-the-badge" alt=".NET Backend">
  <img src="https://img.shields.io/badge/Database-SQLite-8B4513?style=for-the-badge" alt="SQLite Database">
  <img src="https://img.shields.io/badge/Frontend-TypeScript-A0522D?style=for-the-badge" alt="TypeScript Frontend">
  <img src="https://img.shields.io/badge/Build-esbuild-A0522D?style=for-the-badge" alt="esbuild">
  <img src="https://img.shields.io/badge/Philosophy-No_Bloat-D3D3D3?style=for-the-badge" alt="No Bloat Philosophy">
</p>

---

**TinyHind** is a full-stack starter kit for developers who believe in radical simplicity. It's built on a dynamic **.NET** backend and a dependency-free **TypeScript** workflow, designed to produce fast, miniature web applications with persistence.

No `node_modules`, no config hell. Just lean, powerful code.

## ✨ Core Features

* **🚀 Dynamic Backend**: A schema-driven .NET API powered by SQLite. Define your data structures on the fly.
* **✍️ Type-Safe Frontend**: Write clean TypeScript with an awesome developer experience, powered by a client library that's auto-generated from your live backend schema.
* **⚡️ Zero-Dependency Build**: A wicked-fast build process using a standalone **esbuild** binary. No `npm`, no `package.json`, no bloat.
* **🛠️ Simple Tooling**: A lightweight set of tools to manage your development workflow without a complex setup.

---

## 🏁 Getting Started

Get up and running in minutes.

### Prerequisites
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Python 3](https://www.python.org/downloads/) (for the development CLI)

### 1. Setup
Clone or download this repository. The project is structured into three main parts: `backend`, `frontend`, and `tools`.

### 2. Start the Backend
Open a terminal in the `backend` directory and run the API:
```bash
cd backend
dotnet run
```
Your TinyHind API is now running on `http://localhost:5087`.

### 3. Build & Serve the Frontend
The project includes a simple CLI to manage your frontend workflow.

Open a second terminal in the **root** of the project and run the manager:
```bash
python tools/manager.py
```
You'll see a menu. Here's the typical workflow:
1.  Choose **`3. Pull Latest Schema`** to generate your `api-types.ts` file from the running backend.
2.  Choose **`1. Build Project`** to compile your TypeScript with esbuild.
3.  Choose **`2. Serve Project`** to start the development server on `http://localhost:8776`.

Open **`http://localhost:8776`** in your browser, and you'll see your app running!

---

## 💻 Example: Using the Client

Building your application is simple. The developer experience is built around the auto-generated `TinyHindClient`, which gives you full type safety and autocomplete for your backend API.

Here’s how you’d use it in your `frontend/src/main.ts`:

```typescript
// Import the client and the auto-generated types
import { TinyHindClient } from './tinyhind-client.ts';
import { DbSchema } from './api-types.ts';

// Configure your client to connect to the backend
const API_BASE_URL = 'http://localhost:5087';
const TENANT_ID = 'd95cc89b-e287-47d0-996a-508df06d520f';
const tiny = new TinyHindClient(API_BASE_URL, TENANT_ID);

// Now, just use the methods!
async function main() {
    // Create a new record. TypeScript knows the shape of 'Users'!
    const newUser: Partial<DbSchema['Users']> = { 
        name: 'John Wick', 
        email: 'john@thecontinental.com', 
        age: 45 
    };
    
    const result = await tiny.insertRecord('Users', newUser);
    console.log(`New user created with ID: ${result.id}`);

    // Query for records with full type-safety
    const users = await tiny.queryRecords({
        from: 'Users', // Autocomplete for table names!
        select: ['name', 'email'], // Autocomplete for column names!
        where: {
            name: { like: '%Wick%' } // Type-checked conditions!
        }
    });

    console.log('Found users:', users);
}

main();
```

## 💡 Philosophy

**TinyHind** is an opinionated stack. It believes that you can have a modern, type-safe developer experience without the heavy tooling and dependency trees common in web development today. It's for building small, fast, and persistent things with tools that get out of your way.
