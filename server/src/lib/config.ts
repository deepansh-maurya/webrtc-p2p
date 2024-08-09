import {
  RtpCodecCapability,
  TransportListenInfo,
  TransportListenIp,
  WorkerLogTag,
} from "mediasoup/node/lib/types";
import os from "os";

export const config = {
  listenIp: "0.0.0.0",
  listenPort: 3016,
  mediasoup: {
    numWorker: Object.keys(os.cpus),
    worker: {
      rtcMiniPort: 10000,
      rtcMaxPort: 10100,
      logLevel: "debug",
      logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"] as WorkerLogTag[],
    },

    router: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-start-birate": 1000,
          },
        },
      ] as RtpCodecCapability[],
    },

    webRtcTransport: {
      listenIps: [
        {
          ip: "0.0.0.0",
          announcedIp: "13.228.225.19",
        },
        {
          ip: "0.0.0.0",
          announcedIp: "18.142.128.26",
        },
        {
          ip: "0.0.0.0",
          announcedIp: "54.254.162.138",
        },
      ] as TransportListenInfo[],
      maxINcomeBitrate: 1500000,
      initialAvilableOUtgoingBitrate: 100000,
    },
  },
} as const;
