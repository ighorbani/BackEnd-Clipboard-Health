const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const facilitySchema = new Schema(
  {
    name: { type: String, required: false },
    address: { type: String, required: false },
    phone: { type: String, required: false },
    image: { type: String, required: false },
    location: { type: String, required: false },
    beds: { type: Number, required: false },
    manager: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Facility", facilitySchema);
