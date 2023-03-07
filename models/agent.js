const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const agentSchema = new Schema(
  {
    fullName: { type: String, required: false },
    address: { type: String, required: false },
    phone: { type: String, required: false },
    image: { type: String, required: false },
    location: { type: String, required: false },
    customId: { type: String, required: false },
    expertise: [
      {
        type: String,
        required: false,
      },
    ],
    about: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agent", agentSchema);
