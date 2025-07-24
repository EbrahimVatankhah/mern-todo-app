import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [todos, setTodos] = useState([]);
    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [newTodoDescription, setNewTodoDescription] = useState('');
    const [newTodoDueAt, setNewTodoDueAt] = useState(''); 

    const [editingTodoId, setEditingTodoId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDueAt, setEditDueAt] = useState(''); 
    const [message, setMessage] = useState(''); 
    const navigate = useNavigate();

    const getToken = () => {
        return localStorage.getItem('token');
    };

    const api = axios.create({
        baseURL: 'http://localhost:5000/api', 
        headers: {
            'Content-Type': 'application/json',
        },
    });

    api.interceptors.request.use(
        (config) => {
            const token = getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token'); 
                navigate('/login');
                setMessage('Session expired. Please log in again.');
            }
            return Promise.reject(error);
        }
    );


    const fetchTodos = useCallback(async () => {
        try {
            const response = await api.get('/todos');
            setTodos(response.data);
            setMessage('');
        } catch (error) {
            console.error('Error fetching todos:', error);
            setMessage('Failed to load todos. Please try again.');
        }
    }, [api]); 

    const handleAddTodo = async (e) => {
        e.preventDefault();
        setMessage('');
        if (!newTodoTitle.trim()) {
            setMessage('Todo title cannot be empty.');
            return;
        }
        try {
            const todoData = {
                title: newTodoTitle,
                description: newTodoDescription,
            };
            if (newTodoDueAt) {
                todoData.dueAt = new Date(newTodoDueAt).toISOString();
            }

            const response = await api.post('/todos', todoData);
            setTodos([response.data, ...todos]); // Add new todo to the top
            setNewTodoTitle('');
            setNewTodoDescription('');
            setNewTodoDueAt(''); // پاک کردن فیلد تاریخ/زمان
            setMessage('Todo added successfully!');
        } catch (error) {
            console.error('Error adding todo:', error);
            setMessage('Failed to add todo. Please try again.');
        }
    };

    const handleToggleComplete = async (id, currentCompletedStatus) => {
        setMessage('');
        try {
            const response = await api.put(`/todos/${id}`, {
                completed: !currentCompletedStatus,
            });
            setTodos(todos.map((todo) =>
                todo._id === id ? { ...todo, completed: response.data.completed } : todo
            ));
            setMessage('Todo updated successfully!');
        } catch (error) {
            console.error('Error updating todo:', error);
            setMessage('Failed to update todo status. Please try again.');
        }
    };

    const startEditing = (todo) => {
        setEditingTodoId(todo._id);
        setEditTitle(todo.title);
        setEditDescription(todo.description);
        if (todo.dueAt) {
            const date = new Date(todo.dueAt);
            setEditDueAt(date.toISOString().slice(0, 16));
        } else {
            setEditDueAt('');
        }
    };

    const handleSaveEdit = async (id) => {
        setMessage('');
        if (!editTitle.trim()) {
            setMessage('Todo title cannot be empty.');
            return;
        }
        try {
            const todoData = {
                title: editTitle,
                description: editDescription,
            };
            if (editDueAt) {
                todoData.dueAt = new Date(editDueAt).toISOString();
            } else {
                todoData.dueAt = null;
            }

            const response = await api.put(`/todos/${id}`, todoData);
            setTodos(todos.map((todo) =>
                todo._id === id ? response.data : todo
            ));
            setEditingTodoId(null);
            setMessage('Todo updated successfully!');
        } catch (error) {
            console.error('Error saving todo:', error);
            setMessage('Failed to save todo. Please try again.');
        }
    };

    const cancelEditing = () => {
        setEditingTodoId(null);
        setEditTitle('');
        setEditDescription('');
        setEditDueAt(''); 
    };

    const handleDeleteTodo = async (id) => {
        setMessage('');
        if (window.confirm('Are you sure you want to delete this todo?')) {
            try {
                await api.delete(`/todos/${id}`);
                setTodos(todos.filter((todo) => todo._id !== id));
                setMessage('Todo deleted successfully!');
            } catch (error) {
                console.error('Error deleting todo:', error);
                setMessage('Failed to delete todo. Please try again.');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);


    const formatDueAt = (dateString) => {
        if (!dateString) return 'No due date';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleString(undefined, options);
    };


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900">Your To-Do List</h1>
                    <button
                        onClick={handleLogout}
                        className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        Logout
                    </button>
                </div>

                {message && (
                    <p className={`mb-4 text-center text-sm ${message.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}

                <form onSubmit={handleAddTodo} className="mb-8 space-y-4">
                    <div>
                        <label htmlFor="newTodoTitle" className="sr-only">New Todo Title</label>
                        <input
                            type="text"
                            id="newTodoTitle"
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg transition duration-200"
                            placeholder="Add a new todo title..."
                            value={newTodoTitle}
                            onChange={(e) => setNewTodoTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="newTodoDescription" className="sr-only">New Todo Description (Optional)</label>
                        <textarea
                            id="newTodoDescription"
                            rows="2"
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base resize-none transition duration-200"
                            placeholder="Optional description..."
                            value={newTodoDescription}
                            onChange={(e) => setNewTodoDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="newTodoDueAt" className="block text-sm font-medium text-gray-700 mb-1">Due Date and Time (Optional)</label>
                        <input
                            type="datetime-local"
                            id="newTodoDueAt"
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base transition duration-200"
                            value={newTodoDueAt}
                            onChange={(e) => setNewTodoDueAt(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 transform hover:-translate-y-0.5"
                    >
                        Add Todo
                    </button>
                </form>

                {todos.length === 0 ? (
                    <p className="text-center text-gray-500 text-lg py-10">No todos yet! Add one above.</p>
                ) : (
                    <ul className="space-y-4">
                        {todos.map((todo) => (
                            <li
                                key={todo._id}
                                className={`flex flex-col sm:flex-row items-start sm:items-center p-4 rounded-lg shadow-md transition-all duration-300 ${todo.completed ? 'bg-green-50' : 'bg-white'}`}
                            >
                                {editingTodoId === todo._id ? (
                                    <div className="flex-grow w-full space-y-2">
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows="2"
                                            className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                        />
                                        <input
                                            type="datetime-local"
                                            value={editDueAt}
                                            onChange={(e) => setEditDueAt(e.target.value)}
                                            className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <div className="flex space-x-2 mt-2">
                                            <button
                                                onClick={() => handleSaveEdit(todo._id)}
                                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition-colors duration-200"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md text-sm transition-colors duration-200"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-grow flex flex-col sm:flex-row items-start sm:items-center w-full">
                                        <input
                                            type="checkbox"
                                            checked={todo.completed}
                                            onChange={() => handleToggleComplete(todo._id, todo.completed)}
                                            className="form-checkbox h-5 w-5 text-blue-600 mr-3 mt-1 sm:mt-0 cursor-pointer"
                                        />
                                        <div className="flex-grow">
                                            <h3 className={`text-lg font-semibold ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                                {todo.title}
                                            </h3>
                                            {todo.description && (
                                                <p className={`text-sm text-gray-600 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                                                    {todo.description}
                                                </p>
                                            )}
                                            {todo.dueAt && (
                                                <p className={`text-xs text-blue-600 mt-1 ${todo.completed ? 'line-through opacity-70' : ''}`}>
                                                    Due: {formatDueAt(todo.dueAt)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 flex space-x-2 mt-3 sm:mt-0 sm:ml-4">
                                            <button
                                                onClick={() => startEditing(todo)}
                                                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm transition-colors duration-200"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTodo(todo._id)}
                                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-colors duration-200"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Dashboard;