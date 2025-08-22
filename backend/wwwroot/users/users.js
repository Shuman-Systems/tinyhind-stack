import {
  TENANT_ID,
  TinyHindClient
} from "../js/chunk-ZSY4DTTC.js";

// tinylib/bind.ts
var bindings = /* @__PURE__ */ new Map();
var listeners = /* @__PURE__ */ new Map();
function bind(target, data = {}) {
  const elements = typeof target === "string" ? document.querySelectorAll(target) : "length" in target ? target : [target];
  const boundData = new Proxy(data, {
    set(obj, prop, value) {
      const oldValue = obj[prop];
      obj[prop] = value;
      const boundElements = bindings.get(prop) || [];
      boundElements.forEach((el) => {
        const isInput = el.nodeName === "INPUT" || el.nodeName === "TEXTAREA" || el.nodeName === "SELECT";
        const propToUpdate = isInput ? "value" : "textContent";
        if (el[propToUpdate] !== value) {
          el[propToUpdate] = value;
        }
      });
      const propListeners = listeners.get(prop) || [];
      propListeners.forEach((fn) => fn(value, oldValue, prop));
      return true;
    }
  });
  Array.from(elements).forEach((el) => {
    const key = el.dataset.bind || el.id || "content";
    if (!key) return;
    const bindableEl = el;
    const isInput = bindableEl.nodeName === "INPUT" || bindableEl.nodeName === "TEXTAREA" || bindableEl.nodeName === "SELECT";
    const propToRead = isInput ? "value" : "textContent";
    if (!(key in boundData)) {
      boundData[key] = bindableEl[propToRead];
    } else {
      bindableEl[propToRead] = boundData[key];
    }
    if (!bindings.has(key)) bindings.set(key, []);
    bindings.get(key).push(bindableEl);
    bindableEl.addEventListener("input", () => {
      boundData[key] = bindableEl[propToRead];
    });
  });
  return boundData;
}
bind.one = (selector, key, initialValue) => {
  const el = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!el) return null;
  const data = {};
  if (initialValue !== void 0) data[key] = initialValue;
  return bind(el, data);
};
bind.all = (container = document, data = {}) => {
  const selector = "[data-bind], [contenteditable]";
  const elements = container.querySelectorAll(selector);
  return bind(elements, data);
};
bind.on = (property, callback) => {
  if (!listeners.has(property)) listeners.set(property, []);
  listeners.get(property).push(callback);
  return () => {
    const propListeners = listeners.get(property);
    if (!propListeners) return;
    const index = propListeners.indexOf(callback);
    if (index > -1) propListeners.splice(index, 1);
  };
};

// pages/users/users.ts
var userTbody = document.getElementById("users-tbody");
var userForm = document.getElementById("user-form");
var cancelBtn = document.getElementById("cancel-btn");
var tiny = new TinyHindClient("", TENANT_ID);
var state = bind.all(userForm, {
  users: [],
  isEditing: false,
  name: "",
  email: "",
  age: "",
  formTitle: "Add New User",
  submitButtonText: "Add User",
  editingId: null
});
function renderTableBody(users) {
  if (!userTbody) return;
  if (users.length === 0) {
    userTbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-slate-500">No users found.</td></tr>';
    return;
  }
  userTbody.innerHTML = users.map((user) => `
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
        `).join("");
}
async function fetchUsers() {
  try {
    const userQuery = { from: "Users" };
    state.users = await tiny.queryRecords(userQuery);
  } catch (error) {
    console.error(error);
    userTbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-red-500">Error loading users.</td></tr>';
  }
}
function resetForm() {
  state.isEditing = false;
  state.editingId = null;
  state.name = "";
  state.email = "";
  state.age = "";
  state.formTitle = "Add New User";
  state.submitButtonText = "Add User";
  cancelBtn.classList.add("hidden");
}
async function handleFormSubmit(event) {
  event.preventDefault();
  const payload = {
    name: state.name,
    email: state.email,
    age: state.age ? parseInt(state.age) : void 0
  };
  try {
    if (state.isEditing && state.editingId) {
      await tiny.updateRecord("Users", state.editingId, payload);
    } else {
      await tiny.insertRecord("Users", payload);
    }
    resetForm();
    await fetchUsers();
  } catch (error) {
    console.error("Failed to submit form:", error);
  }
}
document.addEventListener("click", async (event) => {
  const target = event.target;
  if (target.matches(".edit-btn")) {
    const id = parseInt(target.dataset.id);
    const userToEdit = state.users.find((u) => u.Id === id);
    if (userToEdit) {
      state.isEditing = true;
      state.editingId = userToEdit.Id;
      state.name = userToEdit.name;
      state.email = userToEdit.email;
      state.age = userToEdit.age;
      state.formTitle = `Editing User #${userToEdit.Id}`;
      state.submitButtonText = "Update User";
      cancelBtn.classList.remove("hidden");
    }
  }
  if (target.matches(".delete-btn")) {
    const id = parseInt(target.dataset.id);
    if (confirm(`Are you sure you want to delete user with ID ${id}?`)) {
      try {
        await tiny.deleteRecord("Users", id);
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
bind.on("users", (users) => renderTableBody(users));
fetchUsers();
