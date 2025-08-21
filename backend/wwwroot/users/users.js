(() => {
  // pages/users/users.ts
  var appRoot = document.getElementById("app-root");
  var tiny = new TinyHindClient("", TENANT_ID);
  var users = [];
  var editingUser = null;
  async function fetchAndRenderUsers() {
    appRoot.innerHTML = "<h2>Loading Users...</h2>";
    try {
      const userQuery = { from: "Users" };
      users = await tiny.queryRecords(userQuery);
      renderUserList();
    } catch (error) {
      appRoot.innerHTML = "<h2>Error loading users.</h2>";
      console.error(error);
    }
  }
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
                ${users.map((user) => `
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
                `).join("")}
            </tbody>
        </table>
        <hr/>
        ${renderForm()}
    `;
    const form = document.getElementById("user-form");
    form.onsubmit = handleFormSubmit;
  }
  function renderForm() {
    const isEditing = editingUser !== null;
    return `
        <h2>${isEditing ? "Edit User" : "Add New User"}</h2>
        <form id="user-form">
            <input type="hidden" id="userId" value="${isEditing ? editingUser.Id : ""}">
            <label for="name">Name:</label>
            <input type="text" id="name" value="${isEditing ? editingUser.name : ""}" required>
            <br/><br/>
            <label for="email">Email:</label>
            <input type="email" id="email" value="${isEditing ? editingUser.email : ""}" required>
            <br/><br/>
            <label for="age">Age:</label>
            <input type="number" id="age" value="${isEditing && editingUser.age !== void 0 ? editingUser.age : ""}">
            <br/><br/>
            <button type="submit">${isEditing ? "Update User" : "Add User"}</button>
            ${isEditing ? '<button type="button" onclick="cancelEdit()">Cancel</button>' : ""}
        </form>
    `;
  }
  async function handleFormSubmit(event) {
    event.preventDefault();
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const ageInput = document.getElementById("age");
    const userIdInput = document.getElementById("userId");
    const id = userIdInput.value ? parseInt(userIdInput.value) : null;
    const newUser = {
      name: nameInput.value,
      email: emailInput.value,
      age: ageInput.value ? parseInt(ageInput.value) : void 0
    };
    try {
      if (id) {
        await tiny.updateRecord("Users", id, newUser);
        console.log(`User ${id} updated.`);
      } else {
        await tiny.insertRecord("Users", newUser);
        console.log("New user added.");
      }
      editingUser = null;
      await fetchAndRenderUsers();
    } catch (error) {
      console.error("Failed to submit form:", error);
    }
  }
  function handleEditClick(id) {
    editingUser = users.find((u) => u.Id === id) || null;
    renderUserList();
  }
  function cancelEdit() {
    editingUser = null;
    renderUserList();
  }
  async function handleDeleteClick(id) {
    if (confirm(`Are you sure you want to delete user with ID ${id}?`)) {
      try {
        await tiny.deleteRecord("Users", id);
        console.log(`User ${id} deleted.`);
        await fetchAndRenderUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  }
  window.handleEditClick = handleEditClick;
  window.handleDeleteClick = handleDeleteClick;
  window.cancelEdit = cancelEdit;
  fetchAndRenderUsers();
})();
