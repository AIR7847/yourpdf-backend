const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Session data receive karne ka route
app.post("/session", (req, res) => {
  const data = req.body;

  console.log("📥 New session received");
  console.log("⏱️ Time spent (sec):", data.duration);
  console.log("📱 Device:", data.userAgent);
  console.log("🖥️ Screen:", data.screen);
  console.log("📡 Network:", data.network);

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("YOURPDF backend is running");
});

app.listen(3000, () => {
  console.log("🚀 Backend running on port 3000");
});
