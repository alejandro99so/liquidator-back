const express = require("express");
const Contact = require("../../models/Contact");
const { validateAdmin } = require("../../utils/admin");

module.exports = () => {
  const router = express.Router();
  // Create contacts request
  router.post("/", async (req, res) => {
    let contact;
    try {
      contact = await Contact.create(req.body);
    } catch (ex) {
      console.log(ex);
      res.status(400).send({ message: "ERROR_CREATING_CONTACT" });
      return;
    }
    res.status(201).send({ message: "CONTACT_CREATED", id: contact._id });
  });

  // Get contacts request
  router.get("/", [
    validateAdmin,
    async (req, res) => {
      try {
        const contacts = await Contact.find({});
        if (!contacts) {
          res.status(400).send({ message: "REQUEST_CONTACTS_NOT_FOUND" });
        } else {
          res.status(200).send(contacts);
        }
      } catch (ex) {
        console.log(ex);
        res.status(400).send({ message: "ERROR_GETTING_CONTACTS_REQUESTS" });
      }
    },
  ]);

  return router;
};
