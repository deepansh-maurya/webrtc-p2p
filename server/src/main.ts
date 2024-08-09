import express from "express";
import dotenv from "dotenv";

import * as Websocket from "ws";
import { websocketConnection } from "./lib/ws";
dotenv.config();
const main = async () => {
  const app = express();
  const port = process.env.PORT;
  console.log(port);

  const server = await app.listen(port, () => {
    console.log("main server started");
  });
  const websocket = new Websocket.Server({ server });

  websocketConnection(websocket);
};

export { main };
