"use client";

import { registerPMTiles } from "@/utils/pmtiles";
import { Box } from "@chakra-ui/react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import protomaps from "protomaps-themes-base";
import { useEffect, useRef } from "react";

export default function MapComponent({
  propertyQuery,
}: {
  propertyQuery?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerPMTiles();
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,

      // Boone, NC
      center: [-81.6746, 36.2168],

      // Adjust this to control how much of Boone you see
      zoom: 12,

      style: {
        version: 8,

        sources: {
          protomaps: {
            type: "vector",
            url: "pmtiles://https://assets.parkwayoverlooks.com/map/boone.pmtiles",
          },
        },

        glyphs:
          "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",

        sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",

        layers: protomaps("protomaps", "light", "en"),
      },
    });

    return () => {
      map.remove();
    };
  }, []);

  return <Box ref={containerRef} w="100%" h="100%" />;
}
