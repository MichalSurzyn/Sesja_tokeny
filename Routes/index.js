import express, { application } from 'express';
import Auth from './auth.js'; // Import routera Auth
import { Verify, VerifyRole } from '../Middleware/verify.js';

const router = express.Router();

const Router = (server) => {
    server.get("/task-manager", (req, res) => {
        try {
            res.status(200).json({
                status: "success",
                data: [],
                message: "Welcome to our Web App homepage",
            });
        } catch (err) {
            res.status(500).json({
                status: "error",
                message: "Routes Index Error",
            });
        }
    });

    // Użycie routera Auth z prefiksem '/task-manager/auth'
    server.use('/task-manager/auth', Auth);

    server.get("/task-manager/user", Verify, (req, res) => {
        res.status(200).json({
            status: "success",
            message: "Welcome to the your Dashboard!",
        });
    });

    server.get("/task-manager/admin", Verify, VerifyRole, (req, res) => {
        res.status(200).json({
            status: "success",
            message: "Welcome to the Admin portal!",
        });
    });
};


Router(router); // Użycie routera

export default Router;