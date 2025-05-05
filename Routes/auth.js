import express from 'express';
import { Logout, Register, Login, AddGroup, GetGroups, deleteGroup, AddTask, GetTasks, updateTaskStatus } from '../Controllers/auth.js';
import Validate from '../Middleware/validate.js';
import { check } from 'express-validator';

const router = express.Router();

// Register route -- POST request
// Endpoint do rejestracji użytkownika
router.post(
    '/register',
    [
        // Walidacja emaila
        check('email')
            .isEmail()
            .withMessage('Enter a valid email address')
            .normalizeEmail(),
        // Walidacja imienia
        check('first_name')
            .not()
            .isEmpty()
            .withMessage('Your first name is required')
            .trim()
            .escape(),
        // Walidacja nazwiska
        check('last_name')
            .not()
            .isEmpty()
            .withMessage('Your last name is required')
            .trim()
            .escape(),
        // Walidacja hasła
        check('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long'),
    ],
    Validate, // Middleware do sprawdzania błędów walidacji
    async (req, res, next) => {
        try {
            await Register(req, res); // Wywołanie funkcji rejestracji
        } catch (error) {
            console.error('Error in Register route:', error.message);
            res.status(500).json({
                status: 'error',
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    },
);

// Login route -- POST request
// Endpoint do logowania użytkownika
router.post(
    '/login',
    [
        // Walidacja emaila
        check('email')
            .isEmail()
            .withMessage('Enter a valid email address')
            .normalizeEmail(),
        // Walidacja hasła
        check('password')
            .not()
            .isEmpty()
            .withMessage('Password is required'),
    ],
    Validate, // Middleware do sprawdzania błędów walidacji
    async (req, res, next) => {
        try {
            await Login(req, res); // Wywołanie funkcji logowania
        } catch (error) {
            console.error('Error in Login route:', error.message);
            res.status(500).json({
                status: 'error',
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    },
);

// Add Group route -- POST request
// Endpoint do dodawania grupy
router.post(
    '/add-group',
    [
        // Walidacja nazwy grupy
        check('name')
            .not()
            .isEmpty()
            .withMessage('Group name is required')
            .trim()
            .escape(),
        // Opcjonalna walidacja opisu grupy
        check('description')
            .optional()
            .trim()
            .escape(),
    ],
    Validate, // Middleware do sprawdzania błędów walidacji
    async (req, res, next) => {
        try {
            await AddGroup(req, res); // Wywołanie funkcji dodawania grupy
        } catch (error) {
            console.error('Error in AddGroup route:', error.message);
            res.status(500).json({
                status: 'error',
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    },
);

// Delete Group route -- DELETE request
// Endpoint do usuwania grupy na podstawie ID
router.delete(
    '/delete/:id',
    async (req, res) => {
        try {
            console.log("Received DELETE request for group with ID:", req.params.id);

            // Wywołanie funkcji deleteGroup, która obsługuje usuwanie grupy
            await deleteGroup(req, res);  
        } catch (error) {
            console.error("Error during DELETE request:", error);
            res.status(500).json({
                status: 'error',
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    }
);

// Add Task route -- POST request
// Endpoint do dodawania zadania
router.post(
    '/tasks',
    [
        // Walidacja nazwy zadania
        check('name')
            .not()
            .isEmpty()
            .withMessage('Task name is required')
            .trim()
            .escape(),
        // Opcjonalna walidacja opisu zadania
        check('description')
            .optional()
            .trim()
            .escape(),
        // Walidacja statusu zadania
        check('status')
            .optional()
            .isIn(['do zrobienia', 'w trakcie', 'ukończony', 'problem'])
            .withMessage('Invalid task status'),
    ],
    Validate, // Middleware do sprawdzania błędów walidacji
    async (req, res, next) => {
        try {
            await AddTask(req, res); // Wywołanie funkcji dodawania zadania
        } catch (error) {
            console.error('Error in AddTask route:', error.message);
            res.status(500).json({
                status: 'error',
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    }
);

// Get Tasks route -- GET request
// Endpoint do pobierania wszystkich zadań
router.get('/tasks', async (req, res) => {
    try {
        await GetTasks(req, res); // Wywołanie funkcji pobierania zadań
    } catch (error) {
        console.error('Error in GetTasks route:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});

// Update Task Status route -- PATCH request
// Endpoint do aktualizacji statusu zadania na podstawie ID
router.patch('/tasks/:id/status', updateTaskStatus); // Funkcja updateTaskStatus z Controller

// Test endpoint -- GET request
// Endpoint testowy do sprawdzania działania serwera
router.get('/test', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Test endpoint working!' });
});

// Logout route -- GET request
// Endpoint do wylogowywania użytkownika
router.get('/logout', async (req, res) => {
    try {
        await Logout(req, res); // Wywołanie funkcji wylogowywania
    } catch (error) {
        console.error('Error in Logout route:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});

// Get Groups route -- GET request
// Endpoint do pobierania wszystkich grup
router.get('/groups', GetGroups);

export default router;
