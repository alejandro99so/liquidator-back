import User from "../../models/User";
import validateAdmin from "../../utils/admin";
import express, { Request, Response } from "express";
import { IPayload } from "../../types";

const user = () => {
  const router = express.Router();
  // Create Users by admin
  router.post("/", [
    validateAdmin,
    async (req: Request, res: Response) => {
      let user;
      try {
        user = await User.create(req.body);
      } catch (ex: any) {
        if (ex.code == 11000) {
          res.status(400).send({ message: "USER_DUPLICATED" });
          return;
        }
        res.status(400).send({ message: "ERROR_CREATING_USER" });
        return;
      }
      res.status(201).send({ message: "USER_CREATED", id: user._id });
    },
  ] as any);

  // Get information from user
  router.get(
    "/",
    async (
      req: Request & {
        payload?: IPayload;
      },
      res: Response
    ) => {
      try {
        const user = await User.findOne({ address: req.payload?.address });
        if (!user) {
          res.status(400).send({ message: "USER_NOT_FOUND" });
        } else {
          res.status(200).send(user);
        }
      } catch (ex) {
        console.log(ex);
        res.status(400).send({ message: "ERROR_GETTING_USER" });
      }
    }
  );

  return router;
};

export default user;
