const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 9000;
const DATA_FILE = 'todos.json';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Read todos from file
function readTodos() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Write todos to file
function writeTodos(todos) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/todos', (req, res) => {
    const todos = readTodos();
    res.json(todos);
});

app.post('/api/todos', (req, res) => {
    const { task } = req.body;
    if (!task) {
        return res.status(400).json({ error: 'Task is required' });
    }

    const todos = readTodos();
    const newTodo = {
        id: Date.now(),
        task,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    writeTodos(todos);
    res.json(newTodo);
});

app.put('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    
    const todos = readTodos();
    const todoIndex = todos.findIndex(todo => todo.id === parseInt(id));
    
    if (todoIndex === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    
    todos[todoIndex].completed = completed;
    if (completed) {
        todos[todoIndex].completedAt = new Date().toISOString();
    }
    
    writeTodos(todos);
    res.json(todos[todoIndex]);
});

app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    
    let todos = readTodos();
    const initialLength = todos.length;
    todos = todos.filter(todo => todo.id !== parseInt(id));
    
    if (todos.length === initialLength) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    
    writeTodos(todos);
    res.json({ message: 'Todo deleted successfully' });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Todo list app running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
