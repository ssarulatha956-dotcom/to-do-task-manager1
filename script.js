const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filters = document.getElementById("filters");
const submitBtn = document.getElementById("submitBtn");

let tasks = [];

try {
    const savedTasks = JSON.parse(
        localStorage.getItem("todoTasks") || "[]"
    );

    if (Array.isArray(savedTasks)) {
        tasks = savedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string"
        );
    }
} catch (error) {
    tasks = [];
}

let currentFilter = "all";
let editingTaskId = null;

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    });

function saveTasks() {
    localStorage.setItem("todoTasks", JSON.stringify(tasks));
}

function createId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function renderTasks() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title
            .toLowerCase()
            .includes(searchTerm);

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "completed" && task.completed) ||
            (currentFilter === "pending" && !task.completed);

        return matchesSearch && matchesFilter;
    });

    taskList.replaceChildren();

    filteredTasks.forEach(task => {
        const item = document.createElement("article");
        item.className = "task-item" +
            (task.completed ? " done" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Complete task");
        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        const content = document.createElement("div");
        content.className = "task-content";

        const title = document.createElement("p");
        title.className = "task-title";
        title.textContent = task.title;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priority = document.createElement("span");
        priority.className = "priority " + task.priority;
        priority.textContent = task.priority;

        meta.appendChild(priority);

        if (task.dueDate) {
            const dueDate = document.createElement("span");
            dueDate.textContent = "Due: " + task.dueDate;
            meta.appendChild(dueDate);
        }

        content.append(title, meta);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "icon-btn";
        editBtn.textContent = "Edit";
        editBtn.setAttribute("aria-label", "Edit task");
        editBtn.addEventListener("click", () => {
            editTask(task.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "icon-btn delete";
        deleteBtn.textContent = "Delete";
        deleteBtn.setAttribute("aria-label", "Delete task");
        deleteBtn.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.append(editBtn, deleteBtn);
        item.append(checkbox, content, actions);
        taskList.appendChild(item);
    });

    emptyState.style.display =
        filteredTasks.length === 0 ? "block" : "none";

    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;

    document.getElementById("totalTasks").textContent = tasks.length;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("taskCount").textContent =
        `${filteredTasks.length} task${filteredTasks.length === 1 ? "" : "s"}`;

    const percentage = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    document.getElementById("progressText").textContent =
        `${percentage}% completed`;

    document.getElementById("progressBar").style.width =
        `${percentage}%`;

    document.querySelectorAll(".filter").forEach(button => {
        const active = button.dataset.filter === currentFilter;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        taskInput.focus();
        return;
    }

    if (editingTaskId) {
        const task = tasks.find(item => item.id === editingTaskId);

        if (task) {
            task.title = title;
            task.priority = priorityInput.value;
            task.dueDate = dueDateInput.value;
        }

        editingTaskId = null;
        submitBtn.textContent = "+ Add Task";
    } else {
        tasks.unshift({
            id: createId(),
            title,
            priority: priorityInput.value,
            dueDate: dueDateInput.value,
            completed: false,
            createdAt: new Date().toISOString()
        });
    }

    saveTasks();
    taskForm.reset();
    priorityInput.value = "Medium";
    renderTasks();
    taskInput.focus();
});

function toggleTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    editingTaskId = id;
    taskInput.value = task.title;
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate || "";
    submitBtn.textContent = "Save Changes";

    taskInput.focus();
    document.getElementById("taskForm").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function deleteTask(id) {
    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) return;

    tasks = tasks.filter(task => task.id !== id);

    if (editingTaskId === id) {
        editingTaskId = null;
        taskForm.reset();
        submitBtn.textContent = "+ Add Task";
    }

    saveTasks();
    renderTasks();
}

filters.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");

    if (!button) return;

    currentFilter = button.dataset.filter;
    renderTasks();
});

searchInput.addEventListener("input", renderTasks);

document.getElementById("clearCompleted").addEventListener("click", () => {
    const completedCount = tasks.filter(task => task.completed).length;

    if (completedCount === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    const confirmed = confirm(
        `Delete all ${completedCount} completed task(s)?`
    );

    if (!confirmed) return;

    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
});

renderTasks();
