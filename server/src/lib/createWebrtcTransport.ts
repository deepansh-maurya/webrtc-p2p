import { Router } from "mediasoup/node/lib/types";
import { config } from "./config";
import axios from "axios";

const createWebrtcTransport = async (mediasoupRouter: Router) => {
  const {
    maxINcomeBitrate,
    initialAvilableOUtgoingBitrate,
  } = config.mediasoup.webRtcTransport;
  let announcedIp;

  const response = await axios.get("https://api.ipify.org?format=json");
  console.log(response.data.ip);

  announcedIp = response.data.ip;

  const transport = await mediasoupRouter.createWebRtcTransport({
    listenInfos: [
      {
        protocol: "udp",
        ip: "0.0.0.0",
        //@ts-ignore
        announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
        portRange: {
          min: Number(process.env.MEDIASOUP_MIN_PORT) || 10000,
          max: Number(process.env.MEDIASOUP_MAX_PORT) || 10100,
        },
      },
    ],
    initialAvailableOutgoingBitrate: 1000000,
  });

  if (maxINcomeBitrate) {
    try {
      await transport.setMaxIncomingBitrate(maxINcomeBitrate);
    } catch (error) {
      console.error(error);
    }
  }

  console.log(
    {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    },
    "important logs"
  );

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    },
  };
};

export { createWebrtcTransport };
