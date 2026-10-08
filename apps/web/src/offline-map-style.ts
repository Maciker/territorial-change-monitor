type BackgroundLayer = {
  id: string;
  type: "background";
  paint: {
    "background-color": string;
  };
};

export function createOfflineAoiStyle(): {
  version: 8;
  name: string;
  sources: Record<string, never>;
  layers: BackgroundLayer[];
} {
  return {
    version: 8,
    name: "offline-aoi",
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#e8e6e1",
        },
      },
    ],
  };
}
