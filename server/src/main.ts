import express from "express";
import * as Websocket from "ws";
import { websocketConnection } from "./lib/ws";
const main = async () => {
  const app = express();
  const port = process.env.PORT;
  const server = await app.listen(port, () => {
    console.log("main server started");
  });
  const websocket = new Websocket.Server({ server });

  websocketConnection(websocket);
};

export { main };
