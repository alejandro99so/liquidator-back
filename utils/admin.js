const User = require("../models/User");

const validateAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      address: req.payload.address,
      role: "ADMIN",
    });
    if (!admin) {
      res.status(401).send({ message: "USER_NOT_ADMIN" });
      return;
    }
  } catch (ex) {
    console.log(ex);
    res.status(401).send({ message: "USER_NOT_FOUND" });
    return;
  }
  next();
};

module.exports = { validateAdmin };
