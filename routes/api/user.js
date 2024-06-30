const express = require("express");
const User = require("../../models/User");
const { validateAdmin } = require("../../utils/admin");
module.exports = () => {
  const router = express.Router();
  // Create Users by admin
  router.post("/", [
    validateAdmin,
    async (req, res) => {
      let user;
      try {
        user = await User.create(req.body);
        console.log({ user });
      } catch (ex) {
        if (ex.code == 11000) {
          res.send({ message: "USER_DUPLICATED" });
          return;
        }
        console.log(ex);
      }
      res.send({ message: "USER_CREATED", id: user._id });
    },
  ]);

  // Get information from user
  router.get("/", async (req, res) => {
    try {
      const user = await User.findOne({ address: req.payload.address });
      if (!user) {
        res.send({ message: "USER_NOT_FOUND" });
      } else {
        res.send(user);
      }
    } catch (ex) {
      console.log(ex);
      res.send({ message: "USER_NOT_FOUND" });
    }
    return;
  });

  return router;
};
