import { Router } from "mediasoup/node/lib/Router";
import { createWorker } from "./worker";
import WebSocket from "ws";
import { createWebrtcTransport } from "./createWebrtcTransport";
import {
  Consumer,
  Producer,
  RtpCapabilities,
  Transport,
} from "mediasoup/node/lib/types";
import { RtpParameters } from "mediasoup/node/lib/fbs/rtp-parameters";
let mediaSoupRouter: Router;
let producerTransport: Transport;
let producer: Producer;
let consumerTransport: Transport;
let consumer: Consumer;
const websocketConnection = async (websocket: WebSocket.Server) => {
  console.log("initializing the mediasoup things ");

  try {
    mediaSoupRouter = await createWorker();
  } catch (error) {
    throw new Error("'''''''''''''''''''''''''''era occur");
  }

  websocket.on("connection", (ws: WebSocket) => {
    console.log("socket connnection stablished");

    ws.on("message", (message: string) => {
      const event = JSON.parse(message);

      switch (event.type) {
        case "getroutercapabilities":
          ongetroutercapabilities(event, ws);
          break;
        case "createPRoducerTransport":
          oncreatePRoducerTransport(event, ws);
          break;
        case "connectPRoducerTransport":
          onconnectPRoducerTransport(event, ws);
          break;
        case "produce":
          onproduce(event, ws);
          break;
        case "createConsumerTransport":
          oncreateConsumerTransport(event, ws);
          break;
        case "connectConsumerTransport":
          onconnectConsumerTransport(event, ws);
          break;
        case "resume":
          onresume(event, ws);
          break;
        case "consume":
          onConsume(event, ws);
          break;
        default:
          break;
      }
    });
  });

  const ongetroutercapabilities = (event: string, ws: WebSocket) => {
    send(ws, "routercapability", mediaSoupRouter.rtpCapabilities);
    console.log("sent rtpcapa", mediaSoupRouter.rtpCapabilities);
  };
  const oncreatePRoducerTransport = async (event: string, ws: WebSocket) => {
    try {
      const { transport, params } = await createWebrtcTransport(
        mediaSoupRouter
      );
      producerTransport = transport;

      send(ws, "producerTransportCreated", params);
      console.log("created producer transport");
    } catch (error) {
      console.error(error);
      send(ws, "error", "error");
    }
  };
  const onconnectPRoducerTransport = async (event: any, ws: WebSocket) => {
    try {
      console.log(event.dtlsParameters, "dtls");

      await producerTransport.connect({ dtlsParameters: event.dtlsParameters });
    } catch (error) {
      console.log(error);
    }
    send(ws, "prodcuerConnected", "producer is connected");
    console.log("producer transport connected");
  };
  const onproduce = async (event: any, ws: WebSocket) => {
    const { kind, rtpParameters } = event;
    console.log(event);

    producer = await producerTransport.produce({ kind, rtpParameters });
    const message = {
      id: producer.id,
    };
    send(ws, "produced", message);
    console.log("stream fetched from client side");

    await broadcast(websocket, "new producer", "new user");
    console.log("stream braodcasted to all users");
  };
  const send = (ws: WebSocket, type: string, msg: any) => {
    const message = {
      type,
      data: msg,
    };
    ws.send(JSON.stringify(message));
  };
  const broadcast = async (ws: WebSocket.Server, type: string, msg: any) => {
    const message = {
      type,
      data: msg,
    };
    ws.clients.forEach((client) => {
      client.send(JSON.stringify(message));
    });
  };

  const oncreateConsumerTransport = async (event: string, ws: WebSocket) => {
    try {
      const { transport, params } = await createWebrtcTransport(
        mediaSoupRouter
      );

      console.log(event, "event");

      consumerTransport = transport;
      send(ws, "subtransportcreated", params);

      console.log("consumer transport created", consumerTransport);
    } catch (error) {
      console.error(error);
    }
  };
  const onconnectConsumerTransport = async (event: any, ws: WebSocket) => {
    console.log(consumerTransport, "consumer transport");

    await consumerTransport.connect({ dtlsParameters: event.dtlsParameters });
    send(ws, "subconnected", "consumer connected");

    console.log("cnsumer connected to sever from sever");
  };
  const onresume = async (event: any, ws: WebSocket) => {
    await consumer.resume();
    send(ws, "resumed", "resumed video");
    console.log("meia resume final step done");
  };

  const onConsume = async (event: any, ws: WebSocket) => {
    const res = await createConsume(producer, event.rtpCapabilities);
    console.log("calling to consume media");

    send(ws, "subscribed", res);
  };

  const createConsume = async (
    producer: Producer,
    rtpCapabilities: RtpCapabilities
  ) => {
    console.log(
      mediaSoupRouter.canConsume({ producerId: producer.id, rtpCapabilities }),
      "checking if it can consume or not"
    );

    if (
      !mediaSoupRouter.canConsume({ producerId: producer.id, rtpCapabilities })
    ) {
      console.error("can not consume");
      return;
    }
    console.log("check passed");
    console.log(consumerTransport, "is it present the consumer transport");

    try {
      consumer = await consumerTransport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true,
      });

      console.log("consuming on the sever");
    } catch (error) {
      console.error(error);
      return;
    }
    return {
      producerId: producer.id,
      id: consumer.id,
      kind: consumer.kind,
      type: consumer.type,
      rtpParameters: consumer.rtpParameters,
      producerPaused: consumer.producerPaused,
    };
  };
};

export { websocketConnection };
