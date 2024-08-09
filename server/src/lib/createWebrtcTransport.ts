import { Router } from "mediasoup/node/lib/types";
import { config } from "./config";

const createWebrtcTransport = async (mediasoupRouter: Router) => {
  const {
    maxINcomeBitrate,
    initialAvilableOUtgoingBitrate,
  } = config.mediasoup.webRtcTransport;

  const transport = await mediasoupRouter.createWebRtcTransport({
    listenIps: config.mediasoup.webRtcTransport.listenIps,
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
