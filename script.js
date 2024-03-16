document.getElementById('date').valueAsDate = new Date();
const dateInput = document.getElementById('date')
const taskInput = document.getElementById('text')
const addtaskButton = document.getElementById('addTaskBtn');
const textContainer = document.querySelector('.text_container');





function createTask(text, date) {

    const div = document.createElement('div')
    div.className = 'taskList';
    div.classList.add('taskList');
    div.draggable = true;


    const li = document.createElement('li');
    li.textContent = date + ' 📩 ' + text;
    li.contentEditable = true;

    const textRemove = document.createElement('p')
    textRemove.innerText = "❌"
    textRemove.addEventListener("click", function () {
        div.remove()
        removeTaskFromLocalStorage(date, text);

    });
    const checkbox = document.createElement('input');
    checkbox.className = "checkbox";

    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
            li.style.textDecoration = 'line-through';
        } else {
            li.style.textDecoration = 'none';
        }
    });

    div.appendChild(checkbox);
    div.appendChild(li);
    div.appendChild(textRemove);
    textContainer.appendChild(div)

    saveTaskToLocalStorage(date, text);
}

addtaskButton.addEventListener('click', function () {
    let date = dateInput.value;
    let text = taskInput.value;

    if (text.trim() === '') {
        alert('Please enter a task description.');
        return;
    }

    taskInput.value = " ";


    createTask(text, date);


})

const defultTask = [
    { text: "Welcome to our to-do list! Just enter your tasks, set a due date, and hit 'Add' to get started" },
    { text: "Start organizing your tasks with our simple to-do list. Enter tasks, set dates, and click 'Add'" },
    { text: "Ready to boost productivity? Add tasks, set dates, and manage your to-do list hassle-free.</li>  " }

]

defultTask.forEach(task => {
    createTask(task.text, task.date);
})

function saveTaskToLocalStorage(date, text) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push({ date: date, text: text });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function removeTaskFromLocalStorage(date, text) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => !(task.date === date && task.text === text));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}


function loadTasksFromLocalStorage() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        createTask(task.text, task.date);
    });
}


window.addEventListener('DOMContentLoaded', loadTasksFromLocalStorage);

const clearAllButton = document.getElementById('clearAllBtn');

clearAllButton.addEventListener('click', function () {
    clearAllTasks();
});

function clearAllTasks() {
   
    textContainer.innerHTML = '';

    localStorage.removeItem('tasks');
}