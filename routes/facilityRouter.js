const express = require("express");
const mainController = require("../controllers/mainController");
const router = express.Router();
const { body } = require("express-validator");

router.get("/getFacilityInfo/:id", mainController.getFacility);
router.get("/getFacilitiesList", mainController.getFacilitiesList);

module.exports = router;
