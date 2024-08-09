import express from "express";
import * as Websocket from "ws";
import { websocketConnection } from "./lib/ws";
const main = async () => {
  const app = express();
  const server = await app.listen(8080, () => {
    console.log("main server started");
  });
  const websocket = new Websocket.Server({ server });

  websocketConnection(websocket);
};

export { main };
