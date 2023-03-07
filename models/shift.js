const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const shiftSchema = new Schema(
  {
    date: { type: Date, required: false },
    shiftTime: { type: String, required: false },

    facility: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Facility",
    },

    agent: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Agent",
    },

    service: { type: String, required: false },
    bed: { type: Number, required: false },
    // room: { type: Number, required: false },
    cost: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shift", shiftSchema);
