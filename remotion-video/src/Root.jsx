import React from "react";
import { Composition } from "remotion";
import { VeloraLaunchFilm } from "./VeloraLaunchFilm.jsx";
import { FPS, TOTAL_FRAMES } from "./motionSpec.js";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VeloraLaunchDemo16x9"
        component={VeloraLaunchFilm}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="VeloraSocialReel9x16"
        component={VeloraLaunchFilm}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
