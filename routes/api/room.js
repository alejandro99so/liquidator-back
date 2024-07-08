const express = require("express");
const TrxReq = require("../../models/TrxReq");
const TrxOffer = require("../../models/TrxOffer");
const Trx = require("../../models/Trx");
const { getCode } = require("../../utils/random");

module.exports = () => {
  const router = express.Router();
  const networks = {
    Base: 0,
    Avalanche: 1,
    Ethereum: 2,
    Arbitrum: 3,
    Polygon: 4,
    Optimism: 5,
  };
  const contractsList = {
    usdc1: "0x5425890298aed601595a70AB815c96711a31Bc65",
  };

  const codeToUse = async () => {
    code = getCode(4);
    const validation = await TrxReq.findOne({ code });
    if (validation) {
      code = await codeToUse();
    }
    return code;
  };

  // request room
  router.post("/request", async (req, res) => {
    const body = req.body;
    const network = networks[body.network];
    const contract = contractsList[`${body.contract.toLowerCase()}${network}`];
    const code = await codeToUse();
    let trx = {
      userAddress: req.payload.address,
      network,
      contract,
      usd: body.usd,
      cop: body.cop,
      typeAccount: body.type,
      message: body.message,
      code,
      cryptoCurrency: body.contract.toLowerCase(),
    };
    if (body.type.toLowerCase() == "qr") {
      trx.qr = body.qr;
    } else {
      trx.bankType = body.bankType;
      trx.bankNumber = body.bankNumber;
    }
    let trxTemp;
    try {
      trxTemp = await TrxReq.create(trx);
      console.log({ trxTemp });
    } catch (ex) {
      console.log(ex.message);
      res.status(400).send({ message: "ERROR_CREATING_TRANSACTION_TEMP" });
      return;
    }
    res.status(201).send({
      message: "REQUEST_ROOM_CREATED",
      id: trxTemp._id,
      code: trxTemp.code,
    });
  });

  // Get request room
  router.get("/request", async (req, res) => {
    let query;
    if (req.query?.active) {
      query = { isActive: true };
    } else if (req.query?.code) {
      query = { code: req.query?.code };
    }
    let requests;
    try {
      requests = await TrxReq.find(query);
    } catch (ex) {
      console.log(ex);
      res.status(400).send({ error: "ERROR_GETTING_TRX" });
      return;
    }
    res.status(200).send(requests);
  });

  // confirm request room
  router.post("/request-confirm", async (req, res) => {
    const id = req.body.id;
    try {
      await TrxReq.updateOne(
        { _id: id, userAddress: req.payload.address },
        { isActive: true }
      );
    } catch (ex) {
      console.log(ex);
      res.status(400).send({ message: "ERROR_CONFIRM_REQUEST" });
      return;
    }
    res.status(200).send({ message: "TRANSACTION_CONFIRMED" });
  });

  // Create offer to room
  router.post("/offer", async (req, res) => {
    const body = req.body;
    let offer = {
      trxId: body.trxId,
      buyerAddrss: req.payload.address,
      usd: body.usd,
    };
    let trxOffer;
    try {
      trxOffer = await TrxOffer.create(offer);
    } catch (ex) {
      console.log(ex.message);
      res.status(400).send({ message: "ERROR_CREATING_OFFER_ROOM" });
      return;
    }
    res.status(201).send({ message: "OFFER_ROOM_CREATED", id: trxOffer._id });
  });

  // confirm room
  router.post("/confirm", async (req, res) => {
    const body = req.body;
    let trx;
    let requestRoom;
    if (body.offerRoom) {
      try {
        const requestRoom = await TrxReq.findOneAndDelete({
          userAddress: req.payload.address,
        });
        const offer = await TrxOffer.findOneAndDelete({ _id: body.offerRoom });
        trx = {
          userAddress: requestRoom.userAddress,
          network: requestRoom.network,
          contract: requestRoom.contract,
          cop: requestRoom.cop,
          typeAccount: requestRoom.typeAccount,
          message: requestRoom.message,
          code: requestRoom.code,
          friends: requestRoom.friends,
          payerAddress: offer.buyerAddrss,
          usd: offer.usd,
        };
      } catch (ex) {
        console.log(ex);
        res.status(400).send({ message: "ERROR_GETTING_TRXS" });
        return;
      }
    } else {
      try {
        requestRoom = await TrxReq.findOneAndDelete({ _id: body.requestRoom });
        trx = {
          userAddress: requestRoom.userAddress,
          network: requestRoom.network,
          contract: requestRoom.contract,
          cop: requestRoom.cop,
          typeAccount: requestRoom.typeAccount,
          message: requestRoom.message,
          code: requestRoom.code,
          friends: requestRoom.friends,
          payerAddress: req.payload.address,
          usd: requestRoom.usd,
        };
      } catch (ex) {
        console.log(ex);
        res.status(400).send({ message: "ERROR_GETTING_TRXS" });
        return;
      }
    }
    let messages = {
      user: trx.userAddress,
      payer: trx.payerAddress,
    };
    const now = Math.floor(Date.now() / 1000);
    if (requestRoom.typeAccount == "qr") {
      trx.qr = requestRoom.qr;
      messages.messageUser = [
        requestRoom.qr,
        `Mensaje: ${requestRoom.message}`,
      ];
      messages.messageUserTime = [now, now];
      messages.messageUserType = ["qr", "text"];
    } else {
      trx.bankType = requestRoom.bankType;
      trx.bankNumber = requestRoom.bankNumber;
      trx.bankName = requestRoom.bankName;
      messages.messageUser = [
        `Banco: ${requestRoom.bankName}`,
        `Tipo de cuenta: ${requestRoom.bankType}`,
        `Número de cuenta: ${requestRoom.bankNumber}`,
        `Mensaje: ${requestRoom.message}`,
      ];
      messages.messageUserTime = [now, now, now, now];
      messages.messageUserType = ["text", "text", "text", "text"];
    }
    let newTrx;
    try {
      newTrx = await Trx.create(trx);
      console.log(newTrx);
    } catch (ex) {
      console.log(ex.message);
      res.status(400).send({ message: "ERROR_CREATING_TRX" });
      return;
    }
    messages.trxId = newTrx._id;
    // Send Messages
    try {
      await Chat.create(messages);
    } catch (ex) {
      console.log(ex.message);
      res.status(400).json({ message: "ERROR_SAVING_MESSAGE" });
      return;
    }
    res.status(200).send({ message: "OFFER_ACEPTED", id: newTrx._id });
  });

  // validate room activate
  router.get("/validate", async (req, res) => {
    let trx;
    try {
      trx = await Trx.find({
        $or: [
          { userAddress: req.payload.address },
          { payerAddress: req.payload.address },
          { friends: req.payload.address },
        ],
      });
    } catch (ex) {
      console.log(ex.message);
      res.status(400).send({ message: "ERROR_GETTING_TRXS" });
      return;
    }
    res.status(200).send({ trx });
  });

  // Join room activated
  router.post("/join", async (req, res) => {
    const code = req.body.code;
    let requests;
    try {
      requests = await TrxReq.findOneAndUpdate(
        { code, isActive: false },
        { $push: { friends: req.payload.address } }
      );
    } catch (ex) {
      console.log(ex);
      res.status(400).send({ error: "ERROR_GETTING_TRX" });
      return;
    }
    res.status(200).send(requests);
  });
  return router;
};
