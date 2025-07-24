const express = require('express');
const { getTodos, addTodo, updateTodo, deleteTodo } = require('../controllers/todoController');
const { protect } = require('../middlewares/authMiddleware'); // Import the protect middleware

const router = express.Router();


router.route('/')
    .get(protect, getTodos)
    .post(protect, addTodo); 
router.route('/:id')
    .put(protect, updateTodo) 
    .delete(protect, deleteTodo); 
module.exports = router;