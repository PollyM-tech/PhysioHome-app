import React, { useState } from "react";
import { Text } from "react-native";
import { setPush } from "@/lib/marketplace/patient";
import { Button, ErrorMessage } from "@/components/marketplace/Primitives";
export default function PushControls({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <Text>
        Phone push notifications are configured in the mobile app. Booking
        updates remain available in your notification inbox on the web.
      </Text>
      <ErrorMessage message={error} />
      {enabled ? (
        <Button
          title="Disable phone notifications on all devices"
          disabled={busy}
          onPress={() => {
            setBusy(true);
            void setPush(false)
              .then(() => onChange(false))
              .catch((e) => setError(e.message))
              .finally(() => setBusy(false));
          }}
        />
      ) : null}
    </>
  );
}
