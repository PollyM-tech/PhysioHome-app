import React, { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import GooglePinMap from "./GooglePinMap.web";
import { MapProps } from "./types";
import "leaflet/dist/leaflet.css";

function OpenStreetPinMap({ value, radiusKm, onChange }: MapProps) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const module = useRef<typeof Leaflet | null>(null);
  const circle = useRef<Leaflet.Circle | null>(null);
  const marker = useRef<Leaflet.CircleMarker | null>(null);
  const onPin = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  onPin.current = onChange;
  useEffect(() => {
    let cancelled = false;
    import("leaflet")
      .then((L) => {
        if (cancelled || !host.current) return;
        module.current = L;
        map.current = L.map(host.current).setView([-1.2921, 36.8219], 11);
        L.tileLayer(
          process.env.EXPO_PUBLIC_MAP_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              process.env.EXPO_PUBLIC_MAP_ATTRIBUTION ||
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          },
        ).addTo(map.current);
        map.current.on("click", (event: Leaflet.LeafletMouseEvent) =>
          onPin.current({
            label: "Pinned location",
            latitude: event.latlng.lat,
            longitude: event.latlng.lng,
          }),
        );
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const L = module.current;
    if (!ready || !L || !map.current) return;
    marker.current?.remove();
    circle.current?.remove();
    if (value) {
      const point: [number, number] = [value.latitude, value.longitude];
      marker.current = L.circleMarker(point, {
        radius: 9,
        color: "#0B2545",
        fillColor: "#138A8A",
        fillOpacity: 1,
      }).addTo(map.current);
      if (radiusKm)
        circle.current = L.circle(point, {
          radius: radiusKm * 1000,
          color: "#138A8A",
          fillOpacity: 0.12,
        }).addTo(map.current);
      map.current.panTo(point);
    }
  }, [value, radiusKm, ready]);
  return (
    <div
      aria-label="Choose a location on the map"
      style={{ position: "relative", zIndex: 0 }}
    >
      <div ref={host} style={{ height: 260, width: "100%" }} />
      {failed ? (
        <p>Map unavailable. Use place search or your current location.</p>
      ) : null}
    </div>
  );
}

export default function PinMap(props: MapProps) {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY ? (
    <GooglePinMap {...props} />
  ) : (
    <OpenStreetPinMap {...props} />
  );
}
