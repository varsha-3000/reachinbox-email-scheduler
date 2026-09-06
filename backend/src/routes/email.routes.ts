import { Router } from "express";
import {
  getScheduledEmailsController,
  getSentEmailsController,
  scheduleEmailController,
  searchEmailsController
} from "../controllers/email.controller.js";

const router = Router();

router.post("/schedule", scheduleEmailController);

router.get("/scheduled", getScheduledEmailsController);

router.get("/sent", getSentEmailsController);

router.get("/search", searchEmailsController);

export default router;