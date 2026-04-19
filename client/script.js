const API = "https://smart-student-dashboard2.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// USER PROFILE
async function loadUserProfile() {
  try {
    const res = await fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const user = await res.json();

    document.getElementById("userProfile").innerHTML = `
      <div>
        <strong>${user.name}</strong> (${user.email})
      </div>
    `;
  } catch (err) {
    console.error(err);
  }
}

// LOAD USERS
async function loadUsers() {
  try {
    const res = await fetch(`${API}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const users = await res.json();

    const select = document.getElementById("assignedTo");
    select.innerHTML = `<option value="">Assign</option>`;

    users.forEach(u => {
      select.innerHTML += `<option value="${u.email}">${u.email}</option>`;
    });

  } catch (err) {
    console.error(err);
  }
}

// ADD TASK
async function addTask() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const deadline = document.getElementById("deadline").value;
  const assignedTo = document.getElementById("assignedTo").value;

  if (!title) return alert("Title required");

  try {
    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, deadline, assignedTo })
    });

    const data = await res.json();
    alert(data.message);

    loadTasks();

  } catch (err) {
    console.error(err);
  }
}

// LOAD TASKS
async function loadTasks() {
  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    let tasks = data.tasks;

    const search = document.getElementById("search").value.toLowerCase();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(search));

    const sort = document.getElementById("sort").value;

    if (sort === "priority") {
      const order = { High: 3, Medium: 2, Low: 1 };
      tasks.sort((a, b) => order[b.priority] - order[a.priority]);
    }

    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach(task => {
      list.innerHTML += `
        <div>
          <h3>${task.title}</h3>
          <p>${task.description || ""}</p>
          <p>${task.assignedTo || "Personal"}</p>

          <select onchange="updateStatus('${task._id}', this.value)">
            <option ${task.status==="To Do"?"selected":""}>To Do</option>
            <option ${task.status==="In Progress"?"selected":""}>In Progress</option>
            <option ${task.status==="Done"?"selected":""}>Done</option>
          </select>

          <button onclick="deleteTask('${task._id}')">Delete</button>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
  }
}

// UPDATE
async function updateStatus(id, status) {
  await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  loadTasks();
}

// DELETE
async function deleteTask(id) {
  await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  loadTasks();
}

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// INIT
loadUserProfile();
loadUsers();
loadTasks();
