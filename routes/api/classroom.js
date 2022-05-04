const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const config = require("config");
const jwt = require("jsonwebtoken");
const auth = require("../../middleware/auth");
const Classroom = require("../../models/Classroom");
const randomstring = require("randomstring");

// @route    POST api/classroom
// @desc     Create a classroom
// @access   Private

router.post(
  "/",
  [auth, [check("name", "Name cannot be empty").not().isEmpty()]], //check if name is empty
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body; //get the name and description from body

    //Generate random classcode
    let classcode;
    let found = "random";

    //Make a new code until it is unique
    while (found) {
      found = "";
      classcode = randomstring.generate(7);
      found = await Classroom.findOne({ classcode });
    }

    //Classroom Object
    const classroomFields = {};
    classroomFields.teacher = req.user.id;
    classroomFields.name = name;
    classroomFields.classcode = classcode;

    if (description) {
      classroomFields.description = description;
    }

    try {
      let teacher = await User.findById(req.user.id);
      let classroom = {};

      //If User is a Student trying to create a Classroom
      if (teacher.role !== "teacher") {
        return res
          .status(403)
          .json({ errors: [{ msg: "Students cannot create a Classroom" }] });
      }

      classroom = new Classroom(classroomFields);

      await classroom.save(async function (err, classroom) {
        teacher.classes.push(classroom.id); //Add the classroom created in teachers classroom array
        await teacher.save();
      });

      res.json(classroom);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    PUT api/classroom
// @desc     Update a classroom
// @access   Private

router.put(
  "/",
  [auth, [check("classcode", "Classcode cannot be empty").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, classcode } = req.body;

    const classroomFields = {};
    classroomFields.teacher = req.user.id;
    classroomFields.name = name;

    if (description) {
      classroomFields.description = description;
    }

    try {
      let classroom = await Classroom.findOne({ classcode });
      if (!classroom) {
        return res
          .status(404)
          .json({ errors: [{ msg: "Classroom Not Found" }] });
      }

      if (req.user.id != classroom.teacher) {
        //If someone other than classroom teacher trying to update
        return res
          .status(403)
          .json({ errors: [{ msg: "You cannot access this Classroom" }] });
      } else {
        classroom = await Classroom.findOneAndUpdate(
          { classcode: classcode },
          { $set: classroomFields },
          { new: true }
        );

        return res.json(classroom);
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    POST api/classroom/join
// @desc     Join a classroom
// @access   Private

router.post(
  "/join",
  [auth, [check("classcode", "ClassCode cannot be Empty").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { classcode } = req.body;

    try {
      let person = await User.findById(req.user.id);
      let classroom = await Classroom.findOne({ classcode });

      if (!classroom) {
        return res
          .status(404)
          .json({ errors: [{ msg: "Classroom Not Found" }] });
      }

      let classesarray = person.classes;
      let classroomid = classroom.id;

      let found = classesarray.find((element) => element == classroomid); //If person is trying to join already joined classroom

      if (!found) {
        person.classes.push(classroom.id);
        await person.save();
        return res.json(person);
      } else {
        return res
          .status(400)
          .json({ errors: [{ msg: "You have already joined the Classroom" }] });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    POST api/classroom/leave
// @desc     Leave a classroom
// @access   Private

router.post(
  "/leave",
  [auth, [check("classcode", "ClassCode cannot be empty").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { classcode } = req.body;

    try {
      let person = await User.findById(req.user.id);
      let classroom = await Classroom.findOne({ classcode });

      if (!classroom) {
        return res
          .status(404)
          .json({ errors: [{ msg: "Classroom Not Found" }] });
      }

      let classesarray = person.classes;
      let classroomid = classroom.id;

      let found = classesarray.find((element) => element == classroomid);

      if (!found) {
        return res
          .status(404)
          .json({ errors: [{ msg: "User has not joined the Classroom" }] });
      } else {
        let index = classesarray.indexOf(found);
        person.classes.splice(index, 1); //Remove the id from classes array
        await person.save();
        return res.json(person);
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    GET api/classroom
// @desc     Get all joined classrooms
// @access   Private

router.get("/", auth, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let person = await User.findById(req.user.id);

    let classesarray = person.classes;
    let classes = [];

    let classesobjects = await Classroom.find();

    classesarray.map((classesid) => {
      let classroom = classesobjects.find((element) => element.id == classesid);
      classes.push(classroom);
    });

    return res.json(classes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route    PUT api/classroom/assignment
// @desc     Upload an assignment in a classroom
// @access   Private

router.put(
  "/assignment",
  [auth, [check("title", "Title Cannot be Empty").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    return res.json(req.body);
  }
);

// @route GET api/classroom/students
// @desc  Get all students in that classroom
// @access Private

router.get(
  "/students",
  [auth, [check("classcode", "Classcode cannot be empty").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  }
);

// @route    DELETE api/classroom/assignment/:assi_id
// @desc     Delete an assignment from a classroom
// @access   Private

// @route    PUT api/classroom/notes
// @desc     Upload Notes in a classroom
// @access   Private

// @route    DELETE api/classroom/notes/:note_id
// @desc     Delete a Note from a classroom
// @access   Private

// @route    GET api/classroom/assignments
// @desc     Get all assignments due in a Classroom
// @access   Private

module.exports = router;
