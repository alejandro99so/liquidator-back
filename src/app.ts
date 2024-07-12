import express, { Express, Request, Response, NextFunction } from "express";
const app: Express = express();
import cors from "cors";
const port = 3000;
import dotenv from "dotenv";
dotenv.config();
import connectDB from "../config/db";
import authUser from "../utils/auth";
import { IPayload } from "../types";
import UserApi from "../routes/api/user";
import RoomApi from "../routes/api/room";
import ContactApi from "../routes/api/contact";
import ChatApi from "../routes/api/chat";
import CoinmarketcapApi from "../routes/api/coinmarketcap";
const whitelist = ["https://buckspay.xyz", "https://app.buckspay.xyz"];
const whitelistDev = ["http://localhost:3001", "http://localhost:3002"];
app.use(
  cors({
    origin: function (origin, callback) {
      console.log({ origin });
      if (
        (process.env.STAGE == "dev" ? whitelistDev : whitelist).indexOf(
          String(origin)
        ) !== -1 ||
        !origin
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PATCH",
  })
);

app.use(express.json());

export const authMiddleware = async (
  req: Request & {
    payload?: IPayload;
  },
  res: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(400).send({ message: "AUTHORIZATION_NOT_FOUND" });
    return;
  }
  const auth = await authUser(authorization as string);
  if (auth.error || !auth.payload) {
    res.status(400).send({ message: auth.message });
    return;
  }
  req.payload = {
    address: auth.payload.address as string,
    signature: auth.payload.signature as string,
    iat: auth.payload.iat as number,
    exp: auth.payload.exp as number,
  };
  next();
};

const initializeServer = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");
    app.use("/contact", ContactApi());
    console.log("here app");
    app.use("/coinmarketcap", CoinmarketcapApi());
    app.use(authMiddleware);
    app.use("/user", UserApi());
    app.use("/room", RoomApi());
    app.use("/chat", ChatApi());
    // app.listen(port, () => {
    //   console.log(`Server is running on port ${port}`);
    // });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};
initializeServer();

export default app;
