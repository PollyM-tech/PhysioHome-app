import React, { useEffect, useRef, useState } from "react";
import { MapProps } from "./types";

let loading: Promise<void> | null = null;
function loadGoogle(key: string) {
  if (typeof google !== "undefined" && google.maps?.Map)
    return Promise.resolve();
  if (!loading)
    loading = new Promise<void>((resolve, reject) => {
      const callback = "physioHomeMapReady";
      const callbacks = window as unknown as Record<string, unknown>;
      callbacks[callback] = () => {
        delete callbacks[callback];
        resolve();
      };
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=${callback}`;
      script.async = true;
      script.onerror = () => {
        delete callbacks[callback];
        loading = null;
        script.remove();
        reject(new Error("Unable to load Google Maps."));
      };
      document.head.appendChild(script);
    });
  return loading;
}
export default function GooglePinMap({ value, radiusKm, onChange }: MapProps) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const circle = useRef<google.maps.Circle | null>(null);
  const onPin = useRef(onChange);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  onPin.current = onChange;
  useEffect(() => {
    let active = true;
    let listener: google.maps.MapsEventListener | undefined;
    loadGoogle(process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY || "")
      .then(() => {
        if (!active || !host.current) return;
        map.current = new google.maps.Map(host.current, {
          center: { lat: -1.2921, lng: 36.8219 },
          zoom: 11,
          streetViewControl: false,
          mapTypeControl: false,
        });
        listener = map.current.addListener(
          "click",
          (event: google.maps.MapMouseEvent) => {
            if (event.latLng)
              onPin.current({
                label: "Pinned location",
                latitude: event.latLng.lat(),
                longitude: event.latLng.lng(),
              });
          },
        );
        setReady(true);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
      listener?.remove();
    };
  }, []);
  useEffect(() => {
    if (!ready || !map.current) return;
    marker.current?.setMap(null);
    circle.current?.setMap(null);
    if (value) {
      const position = { lat: value.latitude, lng: value.longitude };
      map.current.panTo(position);
      marker.current = new google.maps.Marker({ position, map: map.current });
      if (radiusKm)
        circle.current = new google.maps.Circle({
          center: position,
          radius: radiusKm * 1000,
          map: map.current,
          fillColor: "#138A8A",
          fillOpacity: 0.12,
          strokeColor: "#138A8A",
        });
    }
  }, [value, radiusKm, ready]);
  return (
    <div>
      <div
        ref={host}
        aria-label="Choose a location on Google Maps"
        style={{ height: 260, width: "100%" }}
      />
      {error ? (
        <p>
          {error} Use your current location or retry after checking map
          configuration.
        </p>
      ) : null}
    </div>
  );
}
