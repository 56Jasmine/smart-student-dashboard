let chart;
let currentView = "all";

const API = "https://smart-student-dashboard2.onrender.com";
const token = localStorage.getItem("token");

// Protect route
if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}

// LOAD USER PROFILE
async function loadUserProfile() {
  try {
    const res = await fetch(`${API}/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const user = await res.json();

    if (user.message === "Invalid token") {
      logout();
      return;
    }

    document.getElementById("userProfile").innerHTML = `
      <div style="padding:10px; background:#1e293b; border-radius:10px;">
        <strong>${user.name}</strong><br>
        ${user.email}
      </div>
    `;
  } catch (err) {
    console.error(err);
  }
}

// LOAD USERS FOR DROPDOWN
async function loadUsers() {
  try {
    const res = await fetch(`${API}/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const users = await res.json();

    const select = document.getElementById("assignedTo");

    select.innerHTML = `<option value="">Assign to</option>`;

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

  if (!title) {
    alert("Title required");
    return;
  }

  await fetch(`${API}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title, description, deadline, assignedTo })
  });

  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("deadline").value = "";
  document.getElementById("assignedTo").value = "";

  loadTasks();
}

// LOAD TASKS
async function loadTasks() {
  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();
    let tasks = data.tasks;

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    // SEARCH
    const search = document.getElementById("search").value.toLowerCase();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(search));

    // SORT
    const sort = document.getElementById("sort").value;

    if (sort === "priority") {
      const order = { High: 3, Medium: 2, Low: 1 };
      tasks.sort((a, b) => order[b.priority] - order[a.priority]);
    }

    let total = tasks.length;
    let completed = tasks.filter(t => t.status === "Done").length;
    let pending = total - completed;

    tasks.forEach(task => {

      let reminder = "";
      let overdue = false;

      if (task.deadline) {
        const days = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);

        if (days <= 1 && days >= 0) {
          reminder = "Due soon";
          showNotification(task.title + " is due soon");
        }

        if (days < 0) {
          reminder = "Overdue";
          overdue = true;
          showNotification(task.title + " is overdue");
        }
      }

      taskList.innerHTML += `
        <div class="task">
          <h3>${task.title}</h3>
          <p>${task.description || ""}</p>

          <p>${task.assignedTo ? "Assigned to: " + task.assignedTo : "Personal"}</p>

          <p style="color:${overdue ? "red" : "orange"}">${reminder}</p>

          <span class="priority ${task.priority}">
            ${task.priority}
          </span>

          <br><br>

          <select onchange="updateStatus('${task._id}', this.value)">
            <option ${task.status==="To Do"?"selected":""}>To Do</option>
            <option ${task.status==="In Progress"?"selected":""}>In Progress</option>
            <option ${task.status==="Done"?"selected":""}>Done</option>
          </select>

          <br><br>

          <button onclick="editTask('${task._id}', \`${task.title}\`, \`${task.description || ""}\`)">Edit</button>
          <button onclick="deleteTask('${task._id}')">Delete</button>
        </div>
      `;
    });

    document.getElementById("total").innerText = total;
    document.getElementById("completed").innerText = completed;
    document.getElementById("pending").innerText = pending;

  } catch (err) {
    console.error(err);
  }
}

// NOTIFICATIONS
function showNotification(message) {
  if (Notification.permission === "granted") {
    new Notification(message);
  } else {
    Notification.requestPermission();
  }
}

// EDIT TASK
async function editTask(id, oldTitle, oldDescription) {
  const title = prompt("Edit title:", oldTitle);
  const desc = prompt("Edit description:", oldDescription);

  if (!title) return;

  await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title, description: desc })
  });

  loadTasks();
}

// UPDATE STATUS
async function updateStatus(id, status) {
  await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  loadTasks();
}

// DELETE
async function deleteTask(id) {
  if (!confirm("Delete task?")) return;

  await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
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
