const express = require("express");
const connectDB = require("./config/db");
const { urlencoded } = require("express");

const app = express();

connectDB();

app.use(urlencoded({ extended: true }));
app.use(express.json({ extended: false })); //bodyParser

app.get("/", (req, res) => res.send("API RUNNING"));

//Define Routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/classroom", require("./routes/api/classroom"));
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
