import express, { Request, Response } from "express";

const coinmarketcap = () => {
  const router = express.Router();
  router.get("/", async (req: Request, res: Response) => {
    console.log("here before");
    try {
      console.log("here");

      const response = await fetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=25",
        {
          headers: {
            "X-CMC_PRO_API_KEY": "451c7195-5496-438d-bd95-7dd74bc10618",
          },
        }
      );
      const data = await response.json();
      console.log({ data });

      res.send(data);
    } catch (ex: any) {
      console.log(ex);
    }
  });
  return router;
};

export default coinmarketcap;
