let chart;
let currentView = "all";

const API = "https://smart-student-dashboard-2.onrender.com";
const token = localStorage.getItem("token");

// Protect route
if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}

// ================= USER PROFILE =================
async function loadUserProfile() {
  try {
    const res = await fetch(`${API}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const user = await res.json();

    if (!res.ok) {
      logout();
      return;
    }

    document.getElementById("userName").innerText = user.name;
    document.getElementById("userEmail").innerText = user.email;

    // show first letter as avatar
    document.getElementById("profileBtn").innerText =
      user.name.charAt(0).toUpperCase();

  } catch (err) {
    console.error(err);
  }
}

// ================= LOAD TASKS =================
// LOAD PROFILE
async function loadUserProfile() {
  try {
    const res = await fetch(`${API}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const user = await res.json();

    document.getElementById("userName").innerText = user.name;
    document.getElementById("userEmail").innerText = user.email;
    document.getElementById("userInitial").innerText = user.name.charAt(0).toUpperCase();

  } catch (err) {
    console.error(err);
  }
}

// TOGGLE DROPDOWN
function toggleProfile() {
  const dropdown = document.getElementById("profileDropdown");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}

async function loadTasks() {
  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    let tasks = data.tasks || [];

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    // FILTER
    if (currentView === "my") {
      tasks = tasks.filter(t => !t.assignedTo);
    } else if (currentView === "team") {
      tasks = tasks.filter(t => t.assignedTo);
    }

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

      if (task.deadline) {
        const days = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);
        if (days <= 1) reminder = "Due soon";
      }

      const div = document.createElement("div");
      div.className = "task";

      div.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description || ""}</p>
        <p>${task.assignedTo ? "Assigned to: " + task.assignedTo : "Personal Task"}</p>
        <p style="color:red;">${reminder}</p>

        <span class="priority ${task.priority}">
          ${task.priority}
        </span>

        <br><br>

        <select class="status">
          <option ${task.status==="To Do"?"selected":""}>To Do</option>
          <option ${task.status==="In Progress"?"selected":""}>In Progress</option>
          <option ${task.status==="Done"?"selected":""}>Done</option>
        </select>

        <br><br>

        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      `;

      // EVENTS
      div.querySelector(".status").addEventListener("change", (e) => {
        updateStatus(task._id, e.target.value);
      });

      div.querySelector(".edit").addEventListener("click", () => {
        editTask(task);
      });

      div.querySelector(".delete").addEventListener("click", () => {
        deleteTask(task._id);
      });

      taskList.appendChild(div);
    });

    // STATS
    document.getElementById("total").innerText = total;
    document.getElementById("completed").innerText = completed;
    document.getElementById("pending").innerText = pending;

    // CHART
    const todo = tasks.filter(t => t.status === "To Do").length;
    const inProgress = tasks.filter(t => t.status === "In Progress").length;
    const done = tasks.filter(t => t.status === "Done").length;

    if (chart) chart.destroy();

    const ctx = document.getElementById("taskChart").getContext("2d");

    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["To Do", "In Progress", "Done"],
        datasets: [{
          label: "Tasks",
          data: [todo, inProgress, done]
        }]
      }
    });

  } catch (err) {
    console.error(err);
    alert("Error loading tasks");
  }
}

// ================= ADD TASK =================
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
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, description, deadline, assignedTo })
  });

  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("deadline").value = "";
  document.getElementById("assignedTo").value = "";

  loadTasks();
}

// ================= EDIT =================
async function editTask(task) {
  const title = prompt("Edit title:", task.title);
  const desc = prompt("Edit description:", task.description);

  if (!title) return;

  await fetch(`${API}/tasks/${task._id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, description: desc })
  });

  loadTasks();
}

// ================= STATUS =================
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

// ================= DELETE =================
async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;

  await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  loadTasks();
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// ================= FILTER =================
function showMyTasks() {
  currentView = "my";
  loadTasks();
}

function showTeamTasks() {
  currentView = "team";
  loadTasks();
}

// ================= THEME =================
function toggleTheme() {
  document.body.classList.toggle("light");
}

// ================= EVENTS =================
document.getElementById("addBtn").addEventListener("click", addTask);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("themeBtn").addEventListener("click", toggleTheme);

document.getElementById("myTasksBtn").addEventListener("click", showMyTasks);
document.getElementById("teamTasksBtn").addEventListener("click", showTeamTasks);

document.getElementById("search").addEventListener("input", loadTasks);
document.getElementById("sort").addEventListener("change", loadTasks);

// PROFILE DROPDOWN
document.getElementById("profileBtn").addEventListener("click", () => {
  document.getElementById("dropdown").classList.toggle("hidden");
});

window.addEventListener("click", (e) => {
  if (!e.target.closest(".profile-container")) {
    document.getElementById("dropdown").classList.add("hidden");
  }
});

// ================= INIT =================
loadUserProfile();
loadTasks();
