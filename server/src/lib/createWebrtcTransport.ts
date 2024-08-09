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
    listenIps: [
      {
        ip: "0.0.0.0",
        announcedIp: announcedIp,
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: initialAvilableOUtgoingBitrate,
  });

  if (maxINcomeBitrate) {
    try {
      await transport.setMaxIncomingBitrate(maxINcomeBitrate);
    } catch (error) {
      console.error(error);
    }
  }

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
