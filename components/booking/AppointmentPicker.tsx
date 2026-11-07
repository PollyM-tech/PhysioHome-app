import React, { useState } from "react";
import { Platform, Text, View } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Button } from "@/components/marketplace/Primitives";
import {
  defaultAppointmentTime,
  nairobiWallTime,
} from "@/lib/marketplace/scheduling";

export default function AppointmentPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState<"date" | "time" | null>(null);
  const selected = value || defaultAppointmentTime();
  const change = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setMode(null);
    if (event.type === "dismissed" || !date) return;
    const wall = nairobiWallTime(date);
    onChange(
      mode === "date"
        ? wall.slice(0, 10) + "T" + selected.slice(11, 16)
        : selected.slice(0, 10) + "T" + wall.slice(11, 16),
    );
  };
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 16, color: "#0B2545" }}>
        Date: {selected.slice(0, 10)} · Time: {selected.slice(11, 16)}
      </Text>
      <Button
        title="Choose appointment date"
        secondary
        onPress={() => setMode("date")}
      />
      <Button
        title="Choose appointment time"
        secondary
        onPress={() => setMode("time")}
      />
      {mode ? (
        <DateTimePicker
          value={new Date(selected + ":00+03:00")}
          mode={mode}
          timeZoneName="Africa/Nairobi"
          minimumDate={mode === "date" ? new Date() : undefined}
          maximumDate={
            mode === "date" ? new Date(Date.now() + 90 * 86400000) : undefined
          }
          is24Hour
          onChange={change}
          display={Platform.OS === "ios" ? "spinner" : "default"}
        />
      ) : null}
      {mode && Platform.OS === "ios" ? (
        <Button title="Done" onPress={() => setMode(null)} />
      ) : null}
    </View>
  );
}
