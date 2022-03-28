const mongoose = require("mongoose");

const ClassroomSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  assignments: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      files: {
        type: String,
      },
      duedate: {
        type: Date,
      },
    },
  ],
  notes: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      files: {
        type: String,
      },
      duedate: {
        type: Date,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Classroom = mongoose.model("classroom", ClassroomSchema);
