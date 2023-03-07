const { validationResult } = require("express-validator");
const Agent = require("../models/agent");
const Facility = require("../models/facility");
const Shift = require("../models/shift");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../", ".env") });

// RETURN THE LIST OF FACILITIES
exports.getFacilitiesList = (req, res, next) => {
  Facility.find()
    .then((facilities) => {
      res.status(200).json({
        state: "Ok",
        facilities: facilities,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// RETURN INFORMATION OF A SPECIFIC FACILILTY
exports.getFacility = (req, res, next) => {
  Facility.findById(mongoose.Types.ObjectId(req.params.id))
    .then((facility) => {
      res.status(200).json({
        state: "Ok",
        facility: facility,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//  RETURN AGENTS OF A SPECIAL FACILITY DURING A QUARTER
exports.getFacilityAgents = async (req, res, next) => {
  const facilityId = req.params.id;

  try {
    const shifts = await Shift.find({
      facility: { $in: mongoose.Types.ObjectId(facilityId) },
    });

    const agentsIds = shifts.map((shift) => {
      return shift.agent;
    });

    const agentsList = await Agent.find({
      _id: { $in: agentsIds },
    });

    res.status(200).json({
      state: "Ok",
      agents: agentsList,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//  RETURN SHIFTS OF A SPECIAL FACILITY DURING A QUARTER
exports.getFacilityShifts = async (req, res, next) => {
  const facilityId = req.params.id;

  try {
    const shifts = await Shift.find({
      facility: { $in: mongoose.Types.ObjectId(facilityId) },
    }).populate("facility agent");

    res.status(200).json({
      state: "Ok",
      shifts: shifts,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// RETURN REPORT FOR AGENT
exports.getReport = async (req, res, next) => {
  const agentId = req.params.agentId;
  const facilityId = req.params.facilityId;
  let result = [];

  try {
    result = await Shift.find({
      facility: { $in: mongoose.Types.ObjectId(facilityId) },
      agent: { $in: mongoose.Types.ObjectId(agentId) },
    }).populate("agent facility");

    const facilityQuarterShifts = await Shift.find({
      facility: { $in: mongoose.Types.ObjectId(facilityId) },
    });

    const facilityCosts = facilityQuarterShifts.map((shift) => {
      return +shift.cost;
    });

    const agentIncomes = result.map((shift) => {
      return +shift.cost;
    });


    const finalResult = {
      shifts: result.map((shift) => {
        return {
          date: shift.date,
          time: shift.shiftTime,
          service: shift.service,
          bed: shift.bed,
          room: shift.room,
          cost: shift.cost,
        };
      }),

      agentShifts: result.length,
      agentName: result[0].agent?.fullName,
      agentPhone: result[0].agent?.phone,
      agentImage: result[0].agent?.image,
      agentExpertise: result[0].agent?.expertise,
      agentLocation: result[0].agent?.location,
      aboutAgent: result[0].agent?.about,
      agentId: result[0].agent?._id.toString(),
      agentCustomId: result[0].agent?.customId,
      agentIncome: agentIncomes.reduce((a, b) => a + b, 0),

      facilityId: result[0].facility?._id.toString(),
      facilityName: result[0].facility?.name,
      facilityAddress: result[0].facility?.address,
      facilityImage: result[0].facility?.image,
      facilityPhone: result[0].facility?.phone,
      facilityLocation: result[0].facility?.location,
      facilityBeds: result[0].facility?.beds,
      facilityManager: result[0].facility?.facilityManager,
      facilityTotalCosts: facilityCosts.reduce((a, b) => a + b, 0),
      facilityTotalShifts: facilityQuarterShifts.length,

    };

    res.status(200).json({
      state: "Ok",
      result: finalResult,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// CHANGE AGENT ID
exports.changeAgentId = async (req, res, next) => {
  const AgentId = req.params.id;
  const customId = req.body.customId;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      return res.status(422).json({
        state: "Error",
        errors: errors.array(),
      });
    }
    const agent = await Agent.findById(mongoose.Types.ObjectId(AgentId));
    agent.customId = customId;
    agent.save();
    res.status(200).json({
      state: "Ok",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
