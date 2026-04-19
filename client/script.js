let chart;
let currentView = "all";

const API = "https://smart-student-dashboard2.onrender.com";
const token = localStorage.getItem("token");

// 🔐 Protect route
if (!token) {
  alert("Please login first ");
  window.location.href = "login.html";
}

// ➕ ADD TASK
async function addTask() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const deadline = document.getElementById("deadline").value;
  const assignedTo = document.getElementById("assignedTo").value;

  if (!title) {
    alert("Title required!");
    return;
  }

  try {
    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, deadline, assignedTo })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Error adding task ");
      return;
    }

    alert("Task added ");

    // clear inputs
    document.getElementById("title").value = "";
    document.getElementById("description").value = "";
    document.getElementById("deadline").value = "";
    document.getElementById("assignedTo").value = "";

    loadTasks();

  } catch (err) {
    console.error(err);
    alert("Server error ");
  }
}

// 📥 LOAD TASKS
async function loadTasks() {
  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Failed to load tasks ");
      return;
    }

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    let tasks = data.tasks || [];

    // ✅ FIXED FILTER (IMPORTANT)
    if (currentView === "my") {
      tasks = tasks.filter(t => !t.assignedTo); // personal tasks
    } else if (currentView === "team") {
      tasks = tasks.filter(t => t.assignedTo); // assigned tasks
    }

    let total = tasks.length;
    let completed = tasks.filter(t => t.status === "Done").length;
    let pending = total - completed;

    tasks.forEach(task => {

      let reminder = "";
      if (task.deadline) {
        const days = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);
        if (days <= 1) reminder = " Due soon!";
      }

      taskList.innerHTML += `
        <div class="task ${task.assignedTo ? "team" : ""}">
          <h3>${task.title}</h3>
          <p>${task.description || ""}</p>

          <p>
            ${task.assignedTo 
              ? "👥 Assigned to: " + task.assignedTo 
              : "👤 Personal Task"}
          </p>

          <p style="color:red;">${reminder}</p>

          <p>
            <span class="priority ${task.priority}">
              ${task.priority}
            </span>
          </p>

          <select onchange="updateStatus('${task._id}', this.value)">
            <option ${task.status==="To Do"?"selected":""}>To Do</option>
            <option ${task.status==="In Progress"?"selected":""}>In Progress</option>
            <option ${task.status==="Done"?"selected":""}>Done</option>
          </select>

          <br><br>

          <button onclick="editTask('${task._id}', \`${task.title}\`, \`${task.description || ""}\`)">Edit </button>
          <button onclick="deleteTask('${task._id}')">Delete ❌</button>
        </div>
      `;
    });

    // 📊 STATS
    document.getElementById("total").innerText = total;
    document.getElementById("completed").innerText = completed;
    document.getElementById("pending").innerText = pending;

    // 🧠 INSIGHT
    let text = "";
    if (pending > 5) text = "Too many tasks!";
    else if (completed > pending) text = " Great work!";
    else text = "📌 Keep going!";
    document.getElementById("insight").innerText = text;

    // 📊 CHART
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

  } catch (error) {
    console.error(error);
    alert("Server error ❌");
  }
}

// ✏️ EDIT
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

// 📊 STATUS
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

// ❌ DELETE
async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;

  await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  loadTasks();
}

// 🌙 THEME
function toggleTheme() {
  document.body.classList.toggle("light");
}

// 🚪 LOGOUT
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// 🔄 FILTER
function showMyTasks() {
  currentView = "my";
  loadTasks();
}

function showTeamTasks() {
  currentView = "team";
  loadTasks();
}

// 🚀 INIT
loadTasks();
