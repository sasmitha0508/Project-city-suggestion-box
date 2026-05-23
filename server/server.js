const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`);
});