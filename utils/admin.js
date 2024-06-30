const User = require("../models/User");

const validateAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      address: req.payload.address,
      role: "ADMIN",
    });
    if (!admin) {
      res.send({ message: "USER_NOT_ADMIN" });
      return;
    }
    console.log({ admin });
  } catch (ex) {
    console.log(ex);
  }
  next();
};

module.exports = { validateAdmin };
