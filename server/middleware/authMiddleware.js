const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ message: "No token, access denied ❌" });
    }

    // 🔥 EXTRACT TOKEN (IMPORTANT FIX)
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Invalid token format ❌" });
    }

    jwt.verify(token, process.env.JWT_SECRET)


    req.user = decoded;
    next();

  } catch (error) {
    res.status(401).json({ message: "Invalid token ❌" });
  }
};
