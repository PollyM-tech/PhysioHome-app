import AppointmentActions from "@/components/booking/AppointmentActions";
import { formatAppointment } from "@/lib/marketplace/scheduling";
import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState, Linking, Text } from "react-native";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import { cancelBooking, listOffers, respondOffer } from "@/lib/marketplace/api";

type Requests = Awaited<ReturnType<typeof listOffers>>;
export default function RequestsScreen() {
  const [data, setData] = useState<Requests>({ offers: [], appointments: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let running = false;
      const load = async () => {
        if (
          running ||
          AppState.currentState === "background" ||
          AppState.currentState === "inactive"
        )
          return;
        running = true;
        try {
          const response = await listOffers();
          if (active) {
            setData(response);
            setError("");
          }
        } catch (err) {
          if (active)
            setError(
              err instanceof Error ? err.message : "Unable to load requests.",
            );
        } finally {
          running = false;
        }
      };
      void load();
      const timer = setInterval(() => void load(), 10000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );
  const respond = async (id: number, action: "accept" | "decline") => {
    setBusy(true);
    setError("");
    try {
      await respondOffer(id, action);
      setData(await listOffers());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The offer is no longer available.",
      );
    } finally {
      setBusy(false);
    }
  };
  const cancel = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      await cancelBooking(id);
      setData(await listOffers());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not cancel this appointment.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="Matching requests">
      <ErrorMessage message={error} />
      <Text style={{ color: "#707588" }}>
        Offers refresh every 10 seconds while this screen is open. The first
        successful acceptance secures a request.
      </Text>
      {!data.offers.length ? (
        <Card>
          <Text>
            No new offers. Check your service area, availability and specialty,
            or wait for a matching request.
          </Text>
        </Card>
      ) : null}
      {data.offers.map((offer) => (
        <Card key={offer.id}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#0B2545" }}>
            {offer.booking.service}
          </Text>
          <Text>{offer.booking.approximate_area}</Text>
          <Text>{formatAppointment(offer.booking.starts_at)} · 60 minutes</Text>
          <Text>
            Offer expires: {new Date(offer.expires_at).toLocaleTimeString()}
          </Text>
          <Text>
            Fee:{" "}
            {offer.booking.quoted_fee
              ? `KES ${offer.booking.quoted_fee}`
              : "Not configured — payment collection is not enabled."}
          </Text>
          <Text>The exact home address is shared only after acceptance.</Text>
          <Button
            title="Accept request"
            disabled={busy}
            onPress={() => void respond(offer.id, "accept")}
          />
          <Button
            secondary
            title="Decline"
            disabled={busy}
            onPress={() => void respond(offer.id, "decline")}
          />
        </Card>
      ))}
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#0B2545" }}>
        Accepted appointments
      </Text>
      {!data.appointments.length ? (
        <Text>No accepted appointments.</Text>
      ) : null}
      {data.appointments.map((booking) => (
        <Card key={booking.id}>
          <Text style={{ fontWeight: "700", fontSize: 18 }}>
            {booking.service}
          </Text>
          <Text>{formatAppointment(booking.starts_at)}</Text>
          <Text>{booking.location?.label}</Text>
          <Text>
            {booking.location?.latitude.toFixed(5)},{" "}
            {booking.location?.longitude.toFixed(5)}
          </Text>
          {booking.directions ? (
            <Text>Directions: {booking.directions}</Text>
          ) : null}
          {booking.patient_contact ? (
            <>
              <Text style={{ fontWeight: "700", fontSize: 18 }}>
                Patient: {booking.patient_contact.full_name}
              </Text>
              {booking.patient_contact.phone ? (
                <>
                  <Text>Phone: {booking.patient_contact.phone}</Text>
                  <Button
                    secondary
                    title="Call patient"
                    onPress={() => {
                      void Linking.openURL(
                        "tel:" + booking.patient_contact!.phone,
                      ).catch(() =>
                        setError(
                          "Unable to open the phone app. Use the phone number shown above.",
                        ),
                      );
                    }}
                  />
                </>
              ) : (
                <Text>No phone number provided.</Text>
              )}
              {booking.patient_contact.email ? (
                <>
                  <Text>Email: {booking.patient_contact.email}</Text>
                  <Button
                    secondary
                    title="Email patient"
                    onPress={() => {
                      void Linking.openURL(
                        "mailto:" + booking.patient_contact!.email,
                      ).catch(() =>
                        setError(
                          "Unable to open the email app. Use the email address shown above.",
                        ),
                      );
                    }}
                  />
                </>
              ) : null}
            </>
          ) : null}
          {booking.location ? (
            <Button
              secondary
              title="Open in Google Maps"
              onPress={() => {
                void Linking.openURL(
                  "https://www.google.com/maps/dir/?api=1&destination=" +
                    booking.location!.latitude +
                    "," +
                    booking.location!.longitude,
                ).catch(() =>
                  setError(
                    "Unable to open maps. Use the coordinates shown above.",
                  ),
                );
              }}
            />
          ) : null}
          <Text>
            Session total:{" "}
            {booking.quoted_fee
              ? `KES ${Number(booking.quoted_fee).toLocaleString()} · travel included`
              : "Price not set for this earlier appointment"}
          </Text>
          <AppointmentActions
            booking={booking}
            provider
            onChanged={async () => setData(await listOffers())}
          />
          {["payment_pending", "confirmed", "en_route", "arrived"].includes(
            booking.status,
          ) ? (
            <Button
              secondary
              title="Cancel appointment"
              disabled={busy}
              onPress={() => void cancel(booking.id)}
            />
          ) : null}
        </Card>
      ))}
    </Page>
  );
}
