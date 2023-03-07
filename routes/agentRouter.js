const express = require("express");
const mainController = require("../controllers/mainController");
const router = express.Router();
const { body } = require("express-validator");

router.get("/getFacilityAgents/:id", mainController.getFacilityAgents);
router.post("/changeAgentId/:id", body("customId").trim().isLength({min:3,max:20}).matches(/^[A-Za-z0-9.,-_]+$/).withMessage("Please between 3 to 15 characters without space and - _"), mainController.changeAgentId);
router.get("/getReport/:agentId/:facilityId", mainController.getReport);

module.exports = router;
