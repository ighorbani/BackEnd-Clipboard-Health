const express = require("express");
const mainController = require("../controllers/mainController");
const router = express.Router();
const { body } = require("express-validator");

router.get("/getFacilityShifts/:id", mainController.getFacilityShifts);
router.get("/generateShiftsReport/:id", mainController.getAllShiftsReport);

module.exports = router;
