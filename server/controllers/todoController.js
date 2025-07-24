const Todo = require('../models/Todo');


exports.getTodos = async (req, res) => {
    try {
        const todos = await Todo.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(todos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


exports.addTodo = async (req, res) => {
    const { title, description, dueAt } = req.body;

    try {
        const newTodo = new Todo({
            title,
            description,
            dueAt: dueAt || null,
            user: req.user.id,
        });

        const todo = await newTodo.save();
        res.status(201).json(todo);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


exports.updateTodo = async (req, res) => {
    const { title, description, completed, dueAt } = req.body;

    try {
        let todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        if (todo.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to update this todo' });
        }

        todo.title = title !== undefined ? title : todo.title;
        todo.description = description !== undefined ? description : todo.description;
        todo.completed = completed !== undefined ? completed : todo.completed;
        todo.dueAt = dueAt !== undefined ? (dueAt || null) : todo.dueAt;

        await todo.save();
        res.json(todo);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Todo not found' });
        }
        res.status(500).send('Server error');
    }
};


exports.deleteTodo = async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);

        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        if (todo.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this todo' });
        }

        await Todo.deleteOne({ _id: req.params.id }); 
        res.json({ message: 'Todo removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Todo not found' });
        }
        res.status(500).send('Server error');
    }
};