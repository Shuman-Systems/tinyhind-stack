import { TinyHindClient } from '../../../tinylib/tinyhind-client';
import { TENANT_ID } from '../../../config';

const schemaRoot = document.getElementById('schema-root') as HTMLDivElement;
const tiny = new TinyHindClient('', TENANT_ID);

// --- 1. SCHEMA EXPLORER LOGIC (Existing) ---

function toggleSchemaDetails(tableName: string) {
    const detailsElement = document.getElementById(`details-${tableName}`);
    detailsElement?.classList.toggle('hidden');
}

async function loadSchemas() {
    schemaRoot.innerHTML = '<p>Loading schemas...</p>';
    try {
        const schemas = await tiny.getAllSchemas();
        const tableNames = Object.keys(schemas);
        if (tableNames.length === 0) {
            schemaRoot.innerHTML = '<p>No tables found.</p>';
            return;
        }
        schemaRoot.innerHTML = `
            <h2 class="text-2xl font-semibold mb-4 text-slate-300">Discovered Tables</h2>
            <div class="space-y-2">${tableNames.map(name => `
                <div>
                    <button onclick="toggleSchemaDetails('${name}')" class="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded transition-colors flex justify-between items-center">
                        <span class="font-mono font-semibold">${name}</span><span class="text-xs text-slate-400">Click to expand</span>
                    </button>
                    <div id="details-${name}" class="hidden mt-1 border border-slate-700 rounded p-4 bg-slate-800/50">
                        <table class="w-full text-left text-sm">
                            <thead class="text-slate-400"><tr>
                                <th class="p-2">Column Name</th><th class="p-2">Data Type</th><th class="p-2">Default Value</th><th class="p-2">Primary Key?</th>
                            </tr></thead>
                            <tbody class="divide-y divide-slate-700 font-mono">${schemas[name].map(col => `
                                <tr>
                                    <td class="p-2">${col.name}</td><td class="p-2 text-cyan-400">${col.type}</td>
                                    <td class="p-2 text-yellow-400">${col.dflt_value !== null ? col.dflt_value : '—'}</td>
                                    <td class="p-2">${col.pk ? '✅ Yes' : 'No'}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`).join('')}
            </div>`;
    } catch (error: any) {
        schemaRoot.innerHTML = `<h2 class="text-red-500">Error loading schemas</h2><pre>${error.message}</pre>`;
    }
}

// --- 2. SCHEMA BUILDER LOGIC (New) ---

const propertiesContainer = document.getElementById('properties-container') as HTMLDivElement;
const form = document.getElementById('schema-builder-form') as HTMLFormElement;
const tableNameInput = document.getElementById('table-name') as HTMLInputElement;
const addPropertyBtn = document.getElementById('add-property-btn') as HTMLButtonElement;
const feedbackDiv = document.getElementById('form-feedback') as HTMLDivElement;

function addPropertyRow() {
    const propId = Date.now(); // Unique ID for the row
    const row = document.createElement('div');
    row.id = `prop-row-${propId}`;
    row.className = 'grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-slate-700/50 p-2 rounded';
    row.innerHTML = `
        <input type="text" placeholder="Property Name" class="prop-name w-full p-2 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500" required>
        <select class="prop-type w-full p-2 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500">
            <option value="string">string (TEXT)</option>
            <option value="integer">integer (INTEGER)</option>
            <option value="number">number (REAL)</option>
            <option value="boolean">boolean (INTEGER 0/1)</option>
        </select>
        <div class="flex items-center justify-between">
            <label class="flex items-center space-x-2 text-sm">
                <input type="checkbox" class="prop-required h-4 w-4 bg-slate-600 border-slate-500 rounded text-cyan-500 focus:ring-cyan-500">
                <span>Required</span>
            </label>
            <button type="button" onclick="document.getElementById('prop-row-${propId}')?.remove()" class="text-red-500 hover:text-red-400 text-xs font-bold">REMOVE</button>
        </div>
    `;
    propertiesContainer.appendChild(row);
}

async function handleFormSubmit(event: Event) {
    event.preventDefault();
    feedbackDiv.textContent = 'Registering...';
    feedbackDiv.className = 'text-yellow-400';

    const tableName = tableNameInput.value.trim();
    if (!tableName) {
        feedbackDiv.textContent = 'Table Name is required.';
        feedbackDiv.className = 'text-red-500';
        return;
    }

    const properties: Record<string, { type: string }> = {};
    const required: string[] = [];
    const propertyRows = propertiesContainer.querySelectorAll('.grid');

    propertyRows.forEach(row => {
        const nameInput = row.querySelector('.prop-name') as HTMLInputElement;
        const typeSelect = row.querySelector('.prop-type') as HTMLSelectElement;
        const requiredCheckbox = row.querySelector('.prop-required') as HTMLInputElement;
        const name = nameInput.value.trim();
        if (name) {
            properties[name] = { type: typeSelect.value };
            if (requiredCheckbox.checked) {
                required.push(name);
            }
        }
    });

    const schema = { properties, required };

    try {
        const result = await tiny.registerTable(tableName, schema);
        feedbackDiv.textContent = 'Success!';
        feedbackDiv.className = 'text-green-400';
        form.reset();
        propertiesContainer.innerHTML = ''; // Clear rows
        await loadSchemas(); // Refresh the explorer
    } catch (error: any) {
        feedbackDiv.textContent = `Error: ${error.message}`;
        feedbackDiv.className = 'text-red-500';
    }
}

function initializeBuilder() {
    addPropertyBtn.onclick = addPropertyRow;
    form.onsubmit = handleFormSubmit;
    // Add one property row to start with
    addPropertyRow();
}

// --- 3. INITIALIZATION ---

(window as any).toggleSchemaDetails = toggleSchemaDetails;
loadSchemas();
initializeBuilder();