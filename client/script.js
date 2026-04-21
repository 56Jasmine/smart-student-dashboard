let chart;
let currentView = "all";

const API = "https://smart-student-dashboard-2.onrender.com";
const token = localStorage.getItem("token");

// Protect route
if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}

// ================= TOAST =================
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = msg;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

// ================= GREETING =================
function setGreeting() {
  const hour = new Date().getHours();
  let text = "Welcome";

  if (hour < 12) text = "Good morning";
  else if (hour < 18) text = "Good afternoon";
  else text = "Good evening";

  const greet = document.getElementById("greeting");
  if (greet) greet.innerText = text;
}

// ================= LOAD TASKS =================
async function loadTasks() {
  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    let tasks = data.tasks || [];

    // FILTER
    if (currentView === "my") {
      tasks = tasks.filter(t => !t.assignedTo);
    } else if (currentView === "team") {
      tasks = tasks.filter(t => t.assignedTo);
    }

    // SEARCH
    const search = document.getElementById("search")?.value?.toLowerCase() || "";
    tasks = tasks.filter(t => t.title.toLowerCase().includes(search));

    // SORT
    const sort = document.getElementById("sort")?.value;
    if (sort === "priority") {
      const order = { High: 3, Medium: 2, Low: 1 };
      tasks.sort((a, b) => order[b.priority] - order[a.priority]);
    }

    // CLEAR COLUMNS
    document.getElementById("todo").innerHTML = "";
    document.getElementById("inProgress").innerHTML = "";
    document.getElementById("done").innerHTML = "";

    // EMPTY STATE
    if (tasks.length === 0) {
      document.getElementById("todo").innerHTML = "<p>No tasks</p>";
      return;
    }

    let total = tasks.length;
    let completed = tasks.filter(t => t.status === "Done").length;
    let pending = total - completed;

    tasks.forEach(task => {
      let reminder = "";
      let overdue = false;

      if (task.deadline) {
        const days = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);

        if (days <= 1 && days >= 0) reminder = "Due soon";
        if (days < 0) {
          reminder = "Overdue";
          overdue = true;
        }
      }

      const div = document.createElement("div");
      div.className = "task";
      div.draggable = true;
      div.dataset.id = task._id;

      if (overdue) {
        div.style.borderLeft = "4px solid red";
      }

      div.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description || ""}</p>
        <p>${task.assignedTo ? "Assigned to: " + task.assignedTo : "Personal Task"}</p>
        <p style="color:red;">${reminder}</p>

        <span class="priority ${task.priority}">
          ${task.priority}
        </span>

        <br><br>

        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      `;

      // DRAG START
      div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("id", task._id);
      });

      // EDIT
      div.querySelector(".edit").addEventListener("click", () => {
        editTask(task);
      });

      // DELETE
      div.querySelector(".delete").addEventListener("click", () => {
        deleteTask(task._id);
      });

      // ADD TO COLUMN
      if (task.status === "To Do") {
        document.getElementById("todo").appendChild(div);
      } else if (task.status === "In Progress") {
        document.getElementById("inProgress").appendChild(div);
      } else {
        document.getElementById("done").appendChild(div);
      }
    });

    // STATS
    document.getElementById("total").innerText = total;
    document.getElementById("completed").innerText = completed;
    document.getElementById("pending").innerText = pending;

    // PROGRESS BAR
    const percent = total ? (completed / total) * 100 : 0;
    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = percent + "%";

    // INSIGHT
    let text = "";
    if (pending > 5) text = "Too many tasks";
    else if (completed > pending) text = "Good progress";
    else text = "Keep going";

    document.getElementById("insight").innerText = text;

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
    showToast("Error loading tasks");
  }
}


// ================= ADD TASK =================
async function addTask() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value;
  const deadline = document.getElementById("deadline").value;
  const assignedTo = document.getElementById("assignedTo").value;

  if (!title) {
    showToast("Title required");
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

  showToast("Task added");
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

  showToast("Task updated");
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

  showToast("Task deleted");
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
document.getElementById("myTasksBtn").addEventListener("click", showMyTasks);
document.getElementById("teamTasksBtn").addEventListener("click", showTeamTasks);
document.getElementById("search").addEventListener("input", loadTasks);
document.getElementById("sort").addEventListener("change", loadTasks);

// ENTER KEY ADD
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// AUTO REFRESH
setInterval(loadTasks, 10000);

// INIT
loadTasks();
setGreeting();

// MIN DATE FIX
document.getElementById("deadline").min =
  new Date().toISOString().split("T")[0];
// ================= DRAG & DROP =================
const zones = ["todo", "inProgress", "done"];

zones.forEach(zoneId => {
  const zone = document.getElementById(zoneId);

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  zone.addEventListener("drop", async (e) => {
    const id = e.dataTransfer.getData("id");

    let newStatus = "To Do";
    if (zoneId === "inProgress") newStatus = "In Progress";
    if (zoneId === "done") newStatus = "Done";

    await updateStatus(id, newStatus);
    showToast("Task moved");
  });
});