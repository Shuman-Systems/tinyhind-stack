// In src/users.ts
//import { TinyHindClient } from '../../tinylib/tinyhind-client.ts';
//import { DbSchema, Query } from '../../tinylib/api-types.ts';
//import { TENANT_ID } from '../../config.ts';

const appRoot = document.getElementById('app-root') as HTMLDivElement;
const tiny = new TinyHindClient('', TENANT_ID);

// --- State Management ---
let users: DbSchema['Users'][] = [];
let editingUser: Partial<DbSchema['Users']> | null = null;

// --- Function to fetch and render all users ---
async function fetchAndRenderUsers() {
    appRoot.innerHTML = '<h2>Loading Users...</h2>';
    try {
        const userQuery: Query<'Users'> = { from: 'Users' };
        users = await tiny.queryRecords(userQuery);
        renderUserList();
    } catch (error) {
        appRoot.innerHTML = '<h2>Error loading users.</h2>';
        console.error(error);
    }
}

// --- Render Functions ---
function renderUserList() {
    appRoot.innerHTML = `
        <h2>All Users</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Age</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.Id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.age}</td>
                        <td>
                            <button onclick="handleEditClick(${user.Id})">Edit</button>
                            <button onclick="handleDeleteClick(${user.Id})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <hr/>
        ${renderForm()}
    `;
    // Add event listeners for the form after it's rendered
    const form = document.getElementById('user-form') as HTMLFormElement;
    form.onsubmit = handleFormSubmit;
}

function renderForm() {
    const isEditing = editingUser !== null;
    return `
        <h2>${isEditing ? 'Edit User' : 'Add New User'}</h2>
        <form id="user-form">
            <input type="hidden" id="userId" value="${isEditing ? editingUser!.Id : ''}">
            <label for="name">Name:</label>
            <input type="text" id="name" value="${isEditing ? editingUser!.name : ''}" required>
            <br/><br/>
            <label for="email">Email:</label>
            <input type="email" id="email" value="${isEditing ? editingUser!.email : ''}" required>
            <br/><br/>
            <label for="age">Age:</label>
            <input type="number" id="age" value="${isEditing && editingUser!.age !== undefined ? editingUser!.age : ''}">
            <br/><br/>
            <button type="submit">${isEditing ? 'Update User' : 'Add User'}</button>
            ${isEditing ? '<button type="button" onclick="cancelEdit()">Cancel</button>' : ''}
        </form>
    `;
}

// --- Event Handlers ---
async function handleFormSubmit(event: Event) {
    event.preventDefault();
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const ageInput = document.getElementById('age') as HTMLInputElement;
    const userIdInput = document.getElementById('userId') as HTMLInputElement;
    
    const id = userIdInput.value ? parseInt(userIdInput.value) : null;
    const newUser = {
        name: nameInput.value,
        email: emailInput.value,
        age: ageInput.value ? parseInt(ageInput.value) : undefined
    };

    try {
        if (id) {
            // Update an existing user
            await tiny.updateRecord('Users', id, newUser);
            console.log(`User ${id} updated.`);
        } else {
            // Insert a new user
            await tiny.insertRecord('Users', newUser);
            console.log("New user added.");
        }
        editingUser = null; // Reset form
        await fetchAndRenderUsers();
    } catch (error) {
        console.error("Failed to submit form:", error);
    }
}

function handleEditClick(id: number) {
    editingUser = users.find(u => u.Id === id) || null;
    renderUserList();
}

function cancelEdit() {
    editingUser = null;
    renderUserList();
}

async function handleDeleteClick(id: number) {
    if (confirm(`Are you sure you want to delete user with ID ${id}?`)) {
        try {
            await tiny.deleteRecord('Users', id); // We will need to create this method
            console.log(`User ${id} deleted.`);
            await fetchAndRenderUsers();
        } catch (error) {
            console.error("Failed to delete user:", error);
        }
    }
}

// --- Expose functions to the global scope for event handlers ---
// This is a simple way to make the button clicks work from the rendered HTML
(window as any).handleEditClick = handleEditClick;
(window as any).handleDeleteClick = handleDeleteClick;
(window as any).cancelEdit = cancelEdit;

// --- Initial call to populate the list ---
fetchAndRenderUsers();