import User from "../models/User";
import { Request, Response, NextFunction } from "express";
import { IPayload } from "../types";

const validateAdmin = async (
  req: Request & {
    payload: IPayload;
  },
  res: Response,
  next: NextFunction
) => {
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

export default validateAdmin;
