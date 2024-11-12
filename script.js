// Select DOM elements
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const addTaskButton = document.getElementById('addTask');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const completionRateSpan = document.getElementById('completionRate');
const exportButton = document.getElementById('exportButton');
const importInput = document.getElementById('importInput');
const importButton = document.getElementById('importButton');

// Add event listeners
addTaskButton.addEventListener('click', addTask);
searchInput.addEventListener('input', filterTasks);
filterSelect.addEventListener('change', filterTasks);
exportButton.addEventListener('click', exportTasks);
importButton.addEventListener('click', () => importInput.click());
importInput.addEventListener('change', importTasks);

// Initialize Sortable
new Sortable(taskList, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    handle: '.drag-handle',
    onEnd: updateStatistics
});

// Function to add a new task
function addTask() {
    const taskText = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (taskText !== '') {
        const li = createTaskElement(taskText, priority);
        taskList.appendChild(li);
        taskInput.value = '';
        taskInput.focus();
        updateStatistics();
    }
}

// Function to create a task element
function createTaskElement(taskText, priority, completed = false) {
    const li = document.createElement('li');
    li.className = `priority-${priority}`;

    // Create drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '☰';
    li.appendChild(dragHandle);

    // Create a progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    const progress = document.createElement('div');
    progress.className = 'progress';
    progress.style.width = completed ? '100%' : '0%';
    progressBar.appendChild(progress);
    li.appendChild(progressBar);

    // Create a span for the task text
    const span = document.createElement('span');
    span.textContent = taskText;
    if (completed) {
        span.style.textDecoration = 'line-through';
    }
    li.appendChild(span);

    // Create buttons
    li.appendChild(createButton('Edit', () => editTask(li, span)));
    li.appendChild(createButton('Complete', () => toggleComplete(li, span, progress)));
    li.appendChild(createButton('Delete', () => {
        taskList.removeChild(li);
        updateStatistics();
    }));

    // Create priority select
    const prioritySelect = document.createElement('select');
    ['low', 'medium', 'high'].forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p.charAt(0).toUpperCase() + p.slice(1);
        prioritySelect.appendChild(option);
    });
    prioritySelect.value = priority;
    prioritySelect.addEventListener('change', (e) => {
        li.className = `priority-${e.target.value}`;
    });
    li.appendChild(prioritySelect);

    return li;
}

// Function to create a button
function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.onclick = onClick;
    return button;
}

// Function to edit a task
function editTask(li, span) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = span.textContent;
    li.insertBefore(input, span);
    li.removeChild(span);

    // Change "Edit" button to "Save"
    const saveBtn = li.querySelector('button');
    saveBtn.textContent = 'Save';
    saveBtn.onclick = function () {
        const newText = input.value.trim();
        if (newText !== '') {
            span.textContent = newText;
            li.insertBefore(span, input);
            li.removeChild(input);
            this.textContent = 'Edit';
            this.onclick = () => editTask(li, span);
            updateStatistics();
        }
    };
}

// Function to toggle task completion
function toggleComplete(li, span, progress) {
    if (span.style.textDecoration === 'line-through') {
        span.style.textDecoration = 'none';
        progress.style.width = '0%';
    } else {
        span.style.textDecoration = 'line-through';
        progress.style.width = '100%';
    }
    updateStatistics();
}

// Function to filter tasks
function filterTasks() {
    const searchText = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;

    Array.from(taskList.children).forEach(li => {
        const taskText = li.querySelector('span:not(.drag-handle)').textContent.toLowerCase();
        const isCompleted = li.querySelector('span:not(.drag-handle)').style.textDecoration === 'line-through';

        const matchesSearch = taskText.includes(searchText);
        const matchesFilter = 
            filterValue === 'all' || 
            (filterValue === 'active' && !isCompleted) || 
            (filterValue === 'completed' && isCompleted);

        li.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
}

// Function to update statistics
function updateStatistics() {
    const tasks = Array.from(taskList.children);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => 
        task.querySelector('span:not(.drag-handle)').style.textDecoration === 'line-through'
    ).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;

    totalTasksSpan.textContent = totalTasks;
    completedTasksSpan.textContent = completedTasks;
    completionRateSpan.textContent = `${completionRate}%`;
}

// Function to export tasks
function exportTasks() {
    const tasks = Array.from(taskList.children).map(li => ({
        text: li.querySelector('span:not(.drag-handle)').textContent,
        priority: li.className.split('-')[1],
        completed: li.querySelector('span:not(.drag-handle)').style.textDecoration === 'line-through'
    }));

    const dataStr = JSON.stringify(tasks);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'tasks.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Function to import tasks
function importTasks(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const tasks = JSON.parse(e.target.result);
            taskList.innerHTML = '';
            tasks.forEach(task => {
                const li = createTaskElement(task.text, task.priority, task.completed);
                taskList.appendChild(li);
            });
            updateStatistics();
        };
        reader.readAsText(file);
    }
}

// Initial statistics update
updateStatistics();