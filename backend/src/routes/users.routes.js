import { Router } from "express";
import { addToHistory, getUserHistory, googleCallback, googleStart, login, register } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/google").get(googleStart)
router.route("/google/callback").get(googleCallback)
router.route("/add_to_activity").post(addToHistory)
router.route("/history").get(getUserHistory)

export default router;
