import { TinyHindClient } from '../../tinylib/tinyhind-client.ts';
import { DbSchema, Query } from '../../tinylib/api-types.ts';
import { TENANT_ID } from '../../config.ts';

import { bind } from '../../tinylib/bind.ts';


// --- Get DOM Elements ---
const userTbody = document.getElementById('users-tbody') as HTMLTableSectionElement;
const userForm = document.getElementById('user-form') as HTMLFormElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;

// --- Initialize TinyHind Client ---
const tiny = new TinyHindClient('', TENANT_ID);


// --- STATE MANAGEMENT ---
const state = bind.all(userForm, {
    users: [] as DbSchema['Users'][],
    isEditing: false,
    name: '',
    email: '',
    age: '',
    formTitle: 'Add New User',
    submitButtonText: 'Add User',
    editingId: null as number | null
});

// --- RENDER FUNCTIONS ---
function renderTableBody(users: DbSchema['Users'][]) {
    if (!userTbody) return;
    if (users.length === 0) {
        userTbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-slate-500">No users found.</td></tr>';
        return;
    }
    userTbody.innerHTML = users.map(user => `
            <tr class="hover:bg-slate-700/50">
                <td class="p-3 text-slate-400">${user.Id}</td>
                <td class="p-3">${user.name}</td>
                <td class="p-3">${user.email}</td>
                <td class="p-3">${user.age}</td>
                <td class="p-3">
                    <button data-id="${user.Id}" class="edit-btn bg-blue-600 hover:bg-blue-500 text-white py-1 px-3 rounded text-sm transition-colors">Edit</button>
                    <button data-id="${user.Id}" class="delete-btn bg-red-600 hover:bg-red-500 text-white py-1 px-3 rounded text-sm transition-colors ml-2">Delete</button>
                </td>
            </tr>
        `).join('');
}

// --- DATA & EVENT HANDLING ---
async function fetchUsers() {
    try {
        const userQuery: Query<'Users'> = { from: 'Users' };
        state.users = await tiny.queryRecords(userQuery);
    } catch (error) {
        console.error(error);
        userTbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-red-500">Error loading users.</td></tr>';
    }
}

function resetForm() {
    state.isEditing = false;
    state.editingId = null;
    state.name = '';
    state.email = '';
    state.age = '';
    state.formTitle = 'Add New User';
    state.submitButtonText = 'Add User';
    cancelBtn.classList.add('hidden');
}

async function handleFormSubmit(event: Event) {
    event.preventDefault();
    const payload: Partial<DbSchema['Users']> = {
        name: state.name,
        email: state.email,
        age: state.age ? parseInt(state.age) : undefined
    };

    try {
        if (state.isEditing && state.editingId) {
            await tiny.updateRecord('Users', state.editingId, payload);
        } else {
            await tiny.insertRecord('Users', payload);
        }
        resetForm();
        await fetchUsers();
    } catch (error) {
        console.error("Failed to submit form:", error);
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;

    if (target.matches('.edit-btn')) {
        const id = parseInt(target.dataset.id!);
        const userToEdit = state.users.find((u: DbSchema['Users']) => u.Id === id);
        if (userToEdit) {
            state.isEditing = true;
            state.editingId = userToEdit.Id;
            state.name = userToEdit.name;
            state.email = userToEdit.email;
            state.age = userToEdit.age;
            state.formTitle = `Editing User #${userToEdit.Id}`;
            state.submitButtonText = 'Update User';
            cancelBtn.classList.remove('hidden');
        }
    }

    if (target.matches('.delete-btn')) {
        const id = parseInt(target.dataset.id!);
        if (confirm(`Are you sure you want to delete user with ID ${id}?`)) {
            try {
                await tiny.deleteRecord('Users', id);
                resetForm();
                await fetchUsers();
            } catch (error) {
                console.error("Failed to submit form:", error);
            }
            await fetchUsers();
        }
    }
});

userForm.onsubmit = handleFormSubmit;
cancelBtn.onclick = resetForm;

// --- INITIALIZE ---
bind.on('users', (users) => renderTableBody(users));
fetchUsers();

