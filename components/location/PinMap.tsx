import React from "react";
import { Platform } from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { MapProps } from "./types";

export default function PinMap({ value, radiusKm, onChange }: MapProps) {
  const center = value ?? { latitude: -1.2921, longitude: 36.8219 };
  const googleKey =
    Platform.OS === "android"
      ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY
      : process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY;
  return (
    <MapView
      provider={googleKey ? PROVIDER_GOOGLE : undefined}
      style={{ height: 260, width: "100%" }}
      region={{ ...center, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
      onPress={(event) =>
        onChange({ ...event.nativeEvent.coordinate, label: "Pinned location" })
      }
    >
      {value ? (
        <Marker
          coordinate={value}
          draggable
          onDragEnd={(event) =>
            onChange({
              ...event.nativeEvent.coordinate,
              label: "Pinned location",
            })
          }
        />
      ) : null}
      {value && radiusKm ? (
        <Circle
          center={value}
          radius={radiusKm * 1000}
          fillColor="rgba(19,138,138,0.15)"
          strokeColor="#138A8A"
        />
      ) : null}
    </MapView>
  );
}
