import User from "../Models/User.js";
import bcrypt from "bcrypt";
import Group from "../Models/Group.js";
import Blacklist from "../Models/Blacklist.js";
import Tasks from "../Models/Tasks.js";
import jwt from "jsonwebtoken"; // Dodanie importu dla JWT

// Funkcja logowania użytkownika
export async function Login(req, res) {
    const { email, password } = req.body;

    try {
        // Wyszukiwanie użytkownika po emailu i dodanie hasła do wyników zapytania
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({
                status: "failed",
                data: [],
                message: "Invalid email or password", // Nieprawidłowy email lub hasło
            });
        }

        // Sprawdzanie, czy podane hasło jest poprawne
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: "failed",
                data: [],
                message: "Invalid email or password", // Nieprawidłowy email lub hasło
            });
        }

        // Generowanie tokenu JWT
        const token = user.generateAccessJWT();

        const options = {
            expiresIn: "20m",
            maxAge: 20 * 60 * 1000,
            httpOnly: false,
            secure: false, // jeśli nie używasz HTTPS
            sameSite: "Lax",
            domain: undefined,
            credentials: true,
        };
        
        console.log("Setting cookie with options:", options);  // Logowanie ustawień ciasteczka

        // Ustawienie ciasteczka z tokenem sesji
        res.cookie("SessionID", token, options);

        const user_data = { id: user._id, email: user.email };

        // Odpowiedź po pomyślnym zalogowaniu
        res.status(200).json({
            status: "success",
            data: [user_data],
            message: "You have successfully logged in.", // Pomyślnie zalogowano
        });
    } catch (err) {
        console.error("Error during login:", {
            message: err.message,
            stack: err.stack,
        });
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: "Controllers Auth Error. Please try again later.", // Błąd w kontrolerze logowania
            error: err.message,
        });
    }
}

// Funkcja dodawania grupy
export async function AddGroup(req, res) {
    const { name, description } = req.body;
    const token = req.cookies.SessionID;

    if (!name) {
        return res.status(400).json({
            status: "failed",
            data: [],
            message: "Group name is required.", // Nazwa grupy jest wymagana
        });
    }

    if (!token) {
        return res.status(401).json({
            status: "failed",
            data: [],
            message: "Unauthorized. No session token provided.", // Brak tokenu sesji
        });
    }

    try {
        // Weryfikacja JWT
        console.log("Otrzymane ciasteczka:", req.cookies);
        console.log("Token JWT z ciasteczka:", req.cookies.SessionID);

        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        const userId = decoded.id;

        // Znalezienie użytkownika po ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "failed",
                data: [],
                message: "User not found.", // Użytkownik nie znaleziony
            });
        }

        // Tworzenie nowej grupy
        const newGroup = new Group({
            name,
            description,
            owner: [userId],
            members: [userId],
        });

        // Zapisanie grupy w bazie danych
        const savedGroup = await newGroup.save();

        res.status(201).json({
            status: "success",
            data: savedGroup,
            message: "Group created successfully.", // Grupa została utworzona pomyślnie
        });
    } catch (err) {
        console.error("Error while creating group:", {
            message: err.message,
            stack: err.stack,
            details: err,
        });
        res.status(500).json({
            status: "error",
            data: [],
            message: "Internal server error. Please try again later.", // Błąd serwera
            error: err.message,
        });
    }
}

// Funkcja usuwania grupy
export async function deleteGroup(req, res) {
    console.log("Inside deleteGroup function");  // Logujemy, że funkcja została wywołana

    const groupId = req.params.id; // ID grupy z URL
    console.log("Group ID to delete:", groupId);

    const token = req.cookies.SessionID; // Token JWT z ciasteczek
    if (!token) {
        console.log("No token provided");
        return res.status(401).json({
            status: "failed",
            message: "Unauthorized. No session token provided." // Brak tokenu sesji
        });
    }

    try {
        console.log("Verifying token...");
        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        console.log("Decoded token:", decoded);

        const userId = decoded.id;

        console.log("Searching for group with ID:", groupId);
        const group = await Group.findById(groupId);
        console.log("Group found:", group);

        if (!group) {
            console.log("Group not found");
            return res.status(404).json({
                status: "failed",
                message: "Group not found." // Grupa nie znaleziona
            });
        }

        if (!group.owner.includes(userId)) {
            console.log("User does not have permission to delete this group");
            return res.status(403).json({
                status: "failed",
                message: "You do not have permission to delete this group." // Brak uprawnień do usunięcia grupy
            });
        }

        console.log("Deleting the group...");
        await Group.findByIdAndDelete(groupId);  // Usuwamy grupę
        console.log("Group deleted successfully");

        res.status(200).json({
            status: "success",
            message: "Group deleted successfully." // Grupa została pomyślnie usunięta
        });
    } catch (err) {
        console.error("Error during delete operation:", err);
        res.status(500).json({
            status: "error",
            message: "Internal server error. Please try again later.", // Błąd serwera
            error: err.message
        });
    }
}

// Funkcja pobierania grup
export async function GetGroups(req, res) {
    try {
        const groups = await Group.find(); // Pobierz wszystkie grupy z bazy danych
        res.status(200).json({
            status: "success",
            data: groups,
            message: "Groups fetched successfully.", // Grupy pobrane pomyślnie
        });
    } catch (err) {
        console.error("Error fetching groups:", err);
        res.status(500).json({
            status: "error",
            message: "Internal Server Error", // Błąd serwera
        });
    }
}

// Funkcja dodawania zadania
export async function AddTask(req, res) {
    const { name, description, status } = req.body;
    const token = req.cookies.SessionID;

    if (!name) {
        console.error('[AddTask] Validation Error: Task name is missing.');
        return res.status(400).json({
            status: 'failed',
            message: 'Task name is required.', // Nazwa zadania jest wymagana
        });
    }

    if (!token) {
        console.error('[AddTask] Unauthorized Error: No session token provided.');
        return res.status(401).json({
            status: 'failed',
            message: 'Unauthorized. No session token provided.', // Brak tokenu sesji
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        const userId = decoded.id;

        // Sprawdzanie, czy użytkownik istnieje
        const user = await User.findById(userId);
        if (!user) {
            console.error(`[AddTask] User not found: User ID ${userId}`);
            return res.status(404).json({
                status: 'failed',
                message: 'User not found.', // Użytkownik nie znaleziony
            });
        }

        // Tworzenie nowego zadania
        const newTask = new Tasks({
            name,
            description,
            status: status || 'do zrobienia', // Domyślny status
            owner: userId,
        });

        const savedTask = await newTask.save();
        console.log(`[AddTask] Task created successfully: ${savedTask._id}`);

        res.status(201).json({
            status: 'success',
            data: savedTask,
            message: 'Task created successfully.', // Zadanie zostało utworzone pomyślnie
        });
    } catch (err) {
        console.error(`[AddTask] Error while creating task: ${err.message}`, err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error. Please try again later.', // Błąd serwera
            error: err.message,
        });
    }
}

// Funkcja pobierania zadań
export async function GetTasks(req, res) {
    try {
        // Pobieranie zadań z bazy danych i populowanie informacji o właścicielu
        const tasks = await Tasks.find().populate('owner', 'email');
        console.log(`[GetTasks] Successfully fetched ${tasks.length} tasks.`);
        res.status(200).json({
            status: 'success',
            data: tasks,
            message: 'Tasks fetched successfully.', // Zadania zostały pobrane pomyślnie
        });
    } catch (err) {
        console.error(`[GetTasks] Error fetching tasks: ${err.message}`, err);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error', // Błąd serwera
            error: err.message,
        });
    }
}

// Funkcja aktualizacji statusu zadania
export async function updateTaskStatus(req, res) {
    const taskId = req.params.id; // ID zadania z URL
    const { status } = req.body;  // Status, który ma być ustawiony

    // Sprawdzanie, czy status jest poprawny
    if (!status || !['do zrobienia', 'w trakcie', 'ukończony', 'problem'].includes(status)) {
        return res.status(400).json({
            status: 'failed',
            message: 'Invalid status provided.', // Nieprawidłowy status
        });
    }

    try {
        // Aktualizacja statusu zadania
        const updatedTask = await Tasks.findByIdAndUpdate(
            taskId, 
            { status },
            { new: true } // Zwraca nową wersję zadania po aktualizacji
        );

        if (!updatedTask) {
            return res.status(404).json({
                status: 'failed',
                message: 'Task not found.', // Zadanie nie zostało znalezione
            });
        }

        res.status(200).json({
            status: 'success',
            data: updatedTask,
            message: 'Task status updated successfully.', // Status zadania został zaktualizowany pomyślnie
        });
    } catch (err) {
        console.error('Error updating task status:', err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error. Please try again later.', // Błąd serwera
            error: err.message,
        });
    }
}

// Funkcja wylogowywania użytkownika
export async function Logout(req, res) {
    try {
        // Sprawdzanie, czy nagłówek cookie zawiera token
        const authHeader = req.headers['cookie'];
        if (!authHeader) return res.sendStatus(204); // Jeśli brak tokenu, brak działania

        const cookie = authHeader.split('=')[1]; // Pobranie tokenu z ciasteczka
        const accessToken = cookie.split(';')[0];

        // Sprawdzenie, czy token znajduje się na czarnej liście
        const checkIfBlacklisted = await Blacklist.findOne({ token: accessToken });
        if (checkIfBlacklisted) return res.sendStatus(204); // Token już na czarnej liście

        // Dodanie tokenu do czarnej listy
        const newBlacklist = new Blacklist({ token: accessToken });
        await newBlacklist.save();

        res.setHeader('Clear-Site-Data', '"cookies"'); // Czyszczenie ciasteczek
        res.status(200).json({ message: 'You are logged out!' }); // Pomyślnie wylogowano
    } catch (err) {
        console.error("Error during logout:", {
            message: err.message,
            stack: err.stack,
        });
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error. Please try again later.', // Błąd serwera
            error: err.message,
        });
    }
}

// Funkcja rejestracji użytkownika
export async function Register(req, res) {
    console.log("Request Body:", req.body);

    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
            status: "failed",
            data: [],
            message: "All fields are required.", // Wszystkie pola są wymagane
        });
    }

    try {
        // Sprawdzanie, czy użytkownik już istnieje
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: "failed",
                data: [],
                message: "User already exists. Please log in.", // Użytkownik już istnieje
            });
        }

        // Tworzenie nowego użytkownika
        const newUser = new User({
            first_name,
            last_name,
            email,
            password,
        });

        const savedUser = await newUser.save();

        const { password: hashedPassword, role, ...user_data } = savedUser._doc;

        res.status(200).json({
            status: "success",
            data: [user_data],
            message: "Account created successfully.", // Konto zostało utworzone pomyślnie
        });
    } catch (err) {
        console.error("Error during registration:", {
            message: err.message,
            stack: err.stack,
        });
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: "Internal Server Error. Please try again later.", // Błąd serwera
            error: err.message,
        });
    }
}