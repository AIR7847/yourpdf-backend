const express = require("express");
const cors = require("cors");

const app = express();

/* 🔥 IMPORTANT FIX */
app.use(cors());
app.use(express.json());
app.use(express.text({ type: "*/*" })); // <-- sendBeacon fix

app.post("/session", (req, res) => {
  let data = req.body;

  // sendBeacon string bhejta hai, usko JSON banao
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error("❌ Invalid JSON");
      return res.sendStatus(400);
    }
  }

  console.log("📥 New session received");
  console.log("⏱️ Time spent (sec):", data.duration);
  console.log("📱 Device:", data.userAgent);
  console.log("🖥️ Screen:", data.screen);
  console.log("📡 Network:", data.network);
  console.log("📌 Reason:", data.reason);

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("YOURPDF backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
