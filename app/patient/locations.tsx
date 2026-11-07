import React, { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "expo-router";
import LocationPicker from "@/components/location/LocationPicker";
import Field from "@/components/forms/Field";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import { Place } from "@/lib/marketplace/api";
import {
  getSavedPlaces,
  savePlace,
  SavedPlace,
} from "@/lib/marketplace/patient";
export default function LocationsScreen() {
  const [places, setPlaces] = useState<SavedPlace[]>([]),
    [pin, setPin] = useState<Place | null>(null),
    [id, setId] = useState<number | undefined>(),
    [label, setLabel] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSavedPlaces()
        .then((d) => {
          if (active) setPlaces(d.locations);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const mutate = async (place: Place & { id?: number; delete?: boolean }) => {
    setBusy(true);
    setError("");
    try {
      setPlaces((await savePlace(place)).locations);
      setId(undefined);
      setPin(null);
      setLabel("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save location.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page backTo="/patient/settings" title="Saved locations">
      <ErrorMessage message={error} />
      <Text>
        Save a map pin with a short name, such as Home. You do not need to type
        an address.
      </Text>
      {!places.length ? <Text>No saved locations yet.</Text> : null}
      {places.map((p) => (
        <Card key={p.id}>
          <Text style={{ fontWeight: "700", fontSize: 18 }}>{p.label}</Text>
          <Text>
            {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
          </Text>
          <Button
            title={"Edit " + p.label}
            secondary
            onPress={() => {
              setPin(p);
              setId(p.id);
              setLabel(p.label);
            }}
          />
          <Button
            title={"Delete " + p.label}
            secondary
            disabled={busy}
            onPress={() => void mutate({ ...p, delete: true })}
          />
        </Card>
      ))}
      <Card>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>
          {id ? "Edit saved pin" : "Save a location"}
        </Text>
        <Field
          label="Location name"
          value={label}
          maxLength={100}
          onChangeText={setLabel}
        />
        <LocationPicker allowSearch={false} value={pin} onChange={setPin} />
        <Button
          title={busy ? "Saving…" : "Save location"}
          disabled={busy || !pin || !label.trim()}
          onPress={() =>
            pin &&
            void mutate({ ...pin, label: label.trim(), ...(id ? { id } : {}) })
          }
        />
        {id ? (
          <Button
            title="Cancel editing"
            secondary
            onPress={() => {
              setPin(null);
              setLabel("");
              setId(undefined);
            }}
          />
        ) : null}
      </Card>
    </Page>
  );
}
