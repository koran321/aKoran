import express from "express";
import { ClientController } from "../controllers/clientController.js";
import { checkSession, checkPassword } from "../middleware/auth.js";

const router = express.Router();

router.get("/clients", checkSession, ClientController.getAll);
router.post("/add-client", checkPassword, ClientController.create);
router.put("/update-client/:id", checkPassword, ClientController.update);
router.delete("/delete-client/:id", checkPassword, ClientController.delete);

export default router;
