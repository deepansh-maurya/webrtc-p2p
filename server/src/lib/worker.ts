import * as mediasoup from "mediasoup";

import { config } from "./config";
import { Router } from "mediasoup/node/lib/Router";

const worker: Array<{
  worker: Worker;
  router: Router;
}> = [];

let nextMediaWorkerIdx = 0;

const createWorker = async () => {
  const worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.worker.logLevel,
    logTags: config.mediasoup.worker.logTags,
    rtcMinPort: config.mediasoup.worker.rtcMiniPort,
    rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
  });

  worker.on("died", () => {
    console.error("medisoup worker died");
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  });

  console.log("wroker created");

  const mediaCodecs = config.mediasoup.router.mediaCodecs;
  const mediaSoupRouter = await worker.createRouter({ mediaCodecs });
  console.log("router created");

  return mediaSoupRouter;
};

export { createWorker };
