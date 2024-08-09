import React, { useEffect, useState } from "react";
import * as meidasoup from "mediasoup-client";
let oriDevice;
let oriSocket;
let oriProduce;
let consumerTransport;
const VideoComponent = () => {
  const setup = () => {
    oriSocket = new WebSocket("ws://localhost:8080");
    oriSocket.onopen = () => {
      console.log("socket connected to server");

      const msg = {
        type: "getroutercapabilities",
      };
      oriSocket.send(JSON.stringify(msg));
      console.log("requested rtpcapa");
    };

    oriSocket.onmessage = (event) => {
      const resp = JSON.parse(event.data);
      switch (resp.type) {
        case "routercapability":
          onroutercapability(resp);
          break;
        case "producerTransportCreated":
          onproducerTransportCreated(resp);
          break;
        case "subtransportcreated":
          onsubtransportcreated(resp);
          break;
        case "subscribed":
          onSsubscribed(resp);
          break;
        default:
          break;
      }
    };

    const onroutercapability = (resp) => {
      console.log(resp.data, " fetched the rtp capa");

      loadDevice(resp.data);
    };

    const loadDevice = async (routerCapa) => {
      try {
        oriDevice = new meidasoup.Device();

        console.log(routerCapa);

        await oriDevice.load({ routerRtpCapabilities: routerCapa });
        console.log(oriDevice.loaded, "device created and loaded with rtpcapa");
      } catch (error) {
        console.log(error);
      }
    };
  };

  const publish = () => {
    const message = {
      type: "createPRoducerTransport",
      forceTcp: false,
      rtpcapabilities: oriDevice.rtpCapabilities,
    };
    oriSocket.send(JSON.stringify(message));
    console.log("requested send transport");
  };

  const onproducerTransportCreated = async (event) => {
    if (event.error) {
      console.error(event.error);
      return;
    }
    console.log(event.data);

    const transport = oriDevice.createSendTransport(event.data);
    console.log("client producer is created", transport);

    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      const message = {
        type: "connectPRoducerTransport",
        dtlsParameters,
      };
      oriSocket.send(JSON.stringify(message));
      console.log("producer connected to server");

      callback();
    });

    transport.on(
      "produce",
      async ({ kind, rtpParameters }, callback, errback) => {
        const message = {
          type: "produce",
          transportId: transport.id,
          kind,
          rtpParameters,
        };

        oriSocket.send(JSON.stringify(message));
        oriSocket.addEventListener("message", (resp) => {
          if (resp.type == "produced") callback(resp.data.id);
          console.log("producer  produced the media to the server");
        });
      }
    );

    let stream = await getUserMedia(transport);
    console.log("getting the media of user ", stream);

    const video = document.querySelector("#video1");

    video.srcObject = stream;
    video.play();
    const track = stream.getVideoTracks()[0];
    console.log("getting the track", track);

    const params = { track };
    oriProduce = await transport.produce(params);
    console.log("final step for client side producer is done");
  };

  const getUserMedia = async () => {
    if (!oriDevice.canProduce("video")) {
      console.error("can not produce medua");
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("stream fetched");
    } catch (error) {
      console.error(error);
      throw new Error("eror");
    }
    return stream;
  };

  const subscribe = () => {
    const message = {
      type: "createConsumerTransport",
      forceTcp: false,
    };
    oriSocket.send(JSON.stringify(message));
    console.log("create consumer transport requestd");
  };
  const onsubtransportcreated = async (event) => {
    const transport = await oriDevice.createRecvTransport(event.data);

    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      const message = {
        type: "connectConsumerTransport",
        dtlsParameters,
        transportId: transport.id,
      };
      oriSocket.send(JSON.stringify(message));
      callback();
      console.log("consumer connected to the server");
    });
    consumerTransport = transport;
    console.log("consumer transport created on client side", consumerTransport);

    const stream = consumer(transport);
    console.log("requested for consume media");
  };

  const consumer = async (transport) => {
    const { rtpCapabilities } = oriDevice;

    const message = {
      type: "consume",
      rtpCapabilities,
    };

    oriSocket.send(JSON.stringify(message));
  };

  const onSsubscribed = async (event) => {
    const { producerId, id, kind, type, rtpParameters, producerPaused } =
      event.data;

    let codecoptions = {};

    const consumer = await consumerTransport.consume({
      producerId,
      id,
      kind,
      rtpParameters,
      codecoptions,
    });
    console.log("consuming media from client", consumer);

    const stream = new MediaStream();
    stream.addTrack(consumer.track);
    console.log(stream, "media from producer");

    const video = document.querySelector("#video2");
    video.srcObject = stream;

    video.play();

    oriSocket.send(
      JSON.stringify({
        type: "resume",
      })
    );
  };
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full justify-center space-x-4 mb-4">
        <div className="w-1/2">
          <video id="video1" className="w-full" controls></video>
        </div>
        <div className="w-1/2">
          <video id="video2" className="w-full" controls></video>
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={publish}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Publish
        </button>

        <button
          onClick={subscribe}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Subscribe
        </button>
        <button
          onClick={setup}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          setup
        </button>
      </div>
    </div>
  );
};

export default VideoComponent;
