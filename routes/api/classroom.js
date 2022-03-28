const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const config = require("config");
const jwt = require("jsonwebtoken");
const auth = require("../../middleware/auth");
const Classroom = require("../../models/Classroom");

// @route    POST api/classroom
// @desc     Create or update a classroom
// @access   Private

router.post(
  "/",
  [auth, [check("name", "Name cannot be empty").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const classroomFields = {};
    classroomFields.teacher = req.user.id;
    classroomFields.name = name;

    if (description) {
      classroomFields.description = description;
    }

    try {
      let teacher = await User.findById(req.user.id);
      let classroom = {};

      //For Create
      classroom = new Classroom(classroomFields);

      await classroom.save(async function (err, classroom) {
        teacher.classes.push(classroom.id);
        await teacher.save();
      });

      res.json(classroom);
    } catch (error) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
