const { validationResult } = require("express-validator");
const Agent = require("../models/agent");
const Facility = require("../models/facility");
const Shift = require("../models/shift");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const options = require("../helpers/options");
dotenv.config({ path: path.join(__dirname, "../", ".env") });
const pdf = require("pdf-creator-node");
const moment = require("moment");

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
    }).populate("agent facility");

    let facilityAgents = shifts.reduce((agents, currentShift) => {
      let agent = agents.find((s) => s.id === currentShift.agent._id);
      if (!agent) {
        agent = {
          id: currentShift.agent._id,
          shifts: 1,
          totalIncome: +currentShift.cost,
          name: currentShift.agent.fullName,
          location: currentShift.agent.location,
          phone: currentShift.agent.phone,
          image: currentShift.agent.image,
          customId: currentShift.agent.customId,
          address: currentShift.agent.address,
        };
        agents.push(agent);
      } else {
        let givenAgent = agents.find((s) => s.id === currentShift.agent._id);
        givenAgent.shifts += 1;
        givenAgent.totalIncome += +currentShift.cost;
      }

      return agents;
    }, []);


    res.status(200).json({
      state: "Ok",
      agents: facilityAgents,
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

//  GENERATES A REPORT FOR SHIFTS OF THAT FACILITY
exports.getAllShiftsReport = async (req, res, next) => {
  const facilityId = req.params.id;
  const html = fs.readFileSync(
    path.join(__dirname, "../views/template.html"),
    "utf-8"
  );
  let random = Math.floor(1000 + Math.random() * 9000).toString();
  const filename = random + "_doc" + ".pdf";

  try {
    const shifts = await Shift.find({
      facility: { $in: mongoose.Types.ObjectId(facilityId) },
    }).populate("facility agent");

    let facilityTotalCosts = shifts.map((shift) => {
      return +shift.cost;
    });
    facilityTotalCosts = facilityTotalCosts.reduce((a, b) => a + b, 0);

    const facilityInfo = {
      facilityName: shifts[0].facility.name,
      facilityPhone: shifts[0].facility.phone,
      facilityManager: shifts[0].facility.manager,
      facilityAddress: shifts[0].facility.address,
      facilityImage: `http://localhost:8080/uploads/facility/${shifts[0].facility.image}`,
      facilityLocation: shifts[0].facility.location,
      facilityTotalCosts: formatter.format(facilityTotalCosts),
      shiftsCount: shifts.length,
      invoiceNumber: random,
      invoiceData: moment().format("YYYY/MM/DD"),
      facilityTax: formatter.format((facilityTotalCosts * 20) / 100),
      grandTotal: formatter.format(((facilityTotalCosts * 20) / 100) + facilityTotalCosts)
    };

    let facilityAgents = shifts.reduce((agents, currentShift) => {
      let agent = agents.find((s) => s.id === currentShift.agent._id);
      if (!agent) {
        agent = {
          id: currentShift.agent._id,
          shifts: 1,
          totalIncome: +currentShift.cost,
          name: currentShift.agent.fullName,
          location: currentShift.agent.location,
          phone: currentShift.agent.phone,
          image: `background-image:url(http://localhost:8080/uploads/agent/${currentShift.agent.image})`,
          customId: currentShift.agent.customId,
          address: currentShift.agent.address,
        };
        agents.push(agent);
      } else {
        let givenAgent = agents.find((s) => s.id === currentShift.agent._id);
        givenAgent.shifts += 1;
        givenAgent.totalIncome += +currentShift.cost;
      }

      return agents;
    }, []);

    facilityAgents.forEach((agent) => {
      agent.totalIncome = formatter.format(agent.totalIncome);
    });

    const finalShift = shifts.map((shift, index) => {
      return {
        counter: index + 1,
        service: shift.service,
        bed: shift.bed,
        room: shift.bed,
        date: moment(shift.date).format("YYYY/MM/DD"),
        shiftTime: shift.shiftTime,
        agentName: shift.agent.fullName,
        agentImage: `background-image:url(http://localhost:8080/uploads/agent/${shift.agent.image})`,
        agentCustomId: shift.agent.customId,
        cost: formatter.format(shift.cost),
      };
    });

    const document = {
      html: html,
      data: {
        shifts: finalShift,
        facilityInfo: facilityInfo,
        facilityAgents: facilityAgents,
      },
      path: "./docs/" + filename,
    };

    pdf
      .create(document, options)
      .then((response) => {
        const filepath = "http://localhost:8080/docs/" + filename;
        res.status(200).json({
          state: "Ok",
          file: filepath,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// This function is for formatting amounts.
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
