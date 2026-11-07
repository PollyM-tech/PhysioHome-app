import AppointmentActions from "@/components/booking/AppointmentActions";
import { getSavedPlaces, SavedPlace } from "@/lib/marketplace/patient";
import AppointmentPicker from "@/components/booking/AppointmentPicker";
import {
  defaultAppointmentTime,
  formatAppointment,
  scheduledInstant,
} from "@/lib/marketplace/scheduling";
import ServiceCheckboxes from "@/components/marketplace/ServiceCheckboxes";
import React, { useCallback, useState } from "react";
import { AppState, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import LocationPicker from "@/components/location/LocationPicker";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import {
  Booking,
  cancelBooking,
  createBooking,
  discoverProviders,
  getCatalog,
  listBookings,
  Place,
  Provider,
  Specialty,
} from "@/lib/marketplace/api";

export default function BookingsScreen() {
  const params = useLocalSearchParams<{ mode?: string; service?: string }>();
  const [maxFee, setMaxFee] = useState(4500);
  const [mode, setMode] = useState<"automatic" | "choose">(
    params.mode === "choose" ? "choose" : "automatic",
  );
  const [services, setServices] = useState<string[]>(
    params.service ? [params.service] : [],
  );
  const [saved, setSaved] = useState<SavedPlace[]>([]);
  const [catalog, setCatalog] = useState<Specialty[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [scheduled, setScheduled] = useState(false);
  const [when, setWhen] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searched, setSearched] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      setMode(params.mode === "choose" ? "choose" : "automatic");
      setServices(params.service ? [params.service] : []);
    }, [params.mode, params.service]),
  );
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let running = false;
      getSavedPlaces()
        .then((d) => {
          if (active) setSaved(d.locations);
        })
        .catch((err) => {
          if (active) setError(err.message);
        });
      getCatalog()
        .then((data) => {
          if (active) setCatalog(data.specialties);
        })
        .catch((err) => {
          if (active) setError(err.message);
        });
      const load = async () => {
        if (
          running ||
          AppState.currentState === "background" ||
          AppState.currentState === "inactive"
        )
          return;
        running = true;
        try {
          const data = await listBookings();
          if (active) setBookings(data.bookings);
        } catch (err) {
          if (active)
            setError(
              err instanceof Error ? err.message : "Unable to load bookings.",
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
  const details = () => {
    if (!place) throw new Error("Confirm a map location for your home visit.");
    let starts_at: string | undefined;
    if (scheduled) {
      starts_at = scheduledInstant(when);
    }
    if (!services.length || services.length > 3)
      throw new Error("Choose between one and three services.");
    return {
      ...place,
      services,
      max_fee: maxFee,
      ...(starts_at ? { starts_at } : {}),
    };
  };
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const search = () =>
    run(async () => {
      setProviders((await discoverProviders(details())).providers);
      setSearched(true);
    });
  const request = (providerId?: number) =>
    run(async () => {
      await createBooking({
        ...details(),
        ...(providerId
          ? {
              preferred_provider_id: providerId,
              expected_fee: providers.find((p) => p.id === providerId)
                ?.session_fee,
            }
          : {}),
      });
      setBookings((await listBookings()).bookings);
    });
  const active = bookings.some((booking) => booking.status === "searching");
  const clearSelection = () => {
    setProviders([]);
    setSearched(false);
  };
  return (
    <Page title="Book physiotherapy care">
      <ErrorMessage message={error} />
      <Card>
        <Button
          title="Find someone available"
          secondary={mode !== "automatic"}
          onPress={() => {
            setMode("automatic");
            clearSelection();
          }}
        />
        <Button
          title="Choose a physiotherapist"
          secondary={mode !== "choose"}
          onPress={() => {
            setMode("choose");
            clearSelection();
          }}
        />
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0B2545" }}>
          Maximum session price
        </Text>
        <Text>
          One 60-minute session, including travel within the provider’s service
          area. Selecting multiple care services does not multiply the price.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[2000, 3000, 3500, 4000, 4500].map((amount) => (
            <Button
              key={amount}
              title={
                "KES " +
                amount.toLocaleString() +
                (maxFee === amount ? " selected" : "")
              }
              secondary={maxFee !== amount}
              onPress={() => {
                setMaxFee(amount);
                clearSelection();
              }}
            />
          ))}
        </View>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0B2545" }}>
          What care do you need?
        </Text>
        <ServiceCheckboxes
          options={catalog}
          selected={services}
          onChange={(selected) => {
            setServices(selected);
            clearSelection();
          }}
        />
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0B2545" }}>
          Confirm your visit location
        </Text>
        {saved.map((pin) => (
          <Button
            key={pin.id}
            secondary
            title={"Use saved location: " + pin.label}
            onPress={() => {
              setPlace(pin);
              clearSelection();
            }}
          />
        ))}
        <LocationPicker
          value={place}
          allowSearch={false}
          onChange={(value) => {
            setPlace(value);
            clearSelection();
          }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <Button
            title="As soon as available"
            secondary={scheduled}
            onPress={() => {
              setScheduled(false);
              clearSelection();
            }}
          />
          <Button
            title="Schedule a time"
            secondary={!scheduled}
            onPress={() => {
              if (!when) setWhen(defaultAppointmentTime());
              setScheduled(true);
              clearSelection();
            }}
          />
        </View>
        {scheduled ? (
          <>
            <Text>Nairobi time (UTC+03:00). Sessions reserve 60 minutes.</Text>
            <AppointmentPicker
              value={when}
              onChange={(value) => {
                setWhen(value);
                clearSelection();
              }}
            />
          </>
        ) : null}
        <Text style={{ color: "#707588" }}>
          Your assigned physiotherapist can use the pin in Google Maps and call
          you after accepting the request.
        </Text>
        <Text style={{ color: "#707588" }}>
          Nearby matching uses geographic distance, not a driving-time estimate.
          No payment is collected in this version.
        </Text>
        {mode === "automatic" ? (
          <Button
            title={
              busy
                ? "Sending request…"
                : `Find a physiotherapist up to KES ${maxFee.toLocaleString()}`
            }
            disabled={!place || !services.length || busy || active}
            onPress={() => void request()}
          />
        ) : (
          <Button
            title={busy ? "Searching…" : "Show eligible physiotherapists"}
            disabled={!place || !services.length || busy || active}
            onPress={() => void search()}
          />
        )}
        {active ? (
          <Text>
            You have an active search below. Cancel it before starting another
            request.
          </Text>
        ) : null}
        {mode === "choose" && searched && !providers.length ? (
          <Text>
            No approved providers within this budget cover this location for the
            selected care and time. Try another time.
          </Text>
        ) : null}
        {mode === "choose"
          ? providers.map((provider) => (
              <Card key={provider.id}>
                <Text style={{ fontWeight: "700", fontSize: 18 }}>
                  {provider.name}
                </Text>
                <Text>
                  {provider.specialty} · {provider.experience}
                </Text>
                <Text>
                  {provider.distance_km} km geographic distance · Verified
                  professional
                </Text>
                <Button
                  title={`Request for KES ${provider.session_fee.toLocaleString()}`}
                  disabled={busy || active}
                  onPress={() => void request(provider.id)}
                />
              </Card>
            ))
          : null}
      </Card>
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#0B2545" }}>
        Your requests
      </Text>
      {!bookings.length ? (
        <Text>Your booking requests will appear here.</Text>
      ) : null}
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
            {booking.service}
          </Text>
          <Text>
            {formatAppointment(booking.starts_at)} ·{" "}
            {booking.booking_mode === "choose"
              ? "Chosen provider"
              : "Automatic matching"}
          </Text>
          {booking.status === "searching" ? (
            <Text>
              Finding a suitable physiotherapist… This screen refreshes every 10
              seconds.
            </Text>
          ) : null}
          {booking.quoted_fee ? (
            <Text style={{ fontSize: 18, fontWeight: "700" }}>
              Agreed total: KES {Number(booking.quoted_fee).toLocaleString()} ·
              travel included
            </Text>
          ) : (
            <Text>
              Budget limit: KES {booking.max_fee.toLocaleString()}.{" "}
              {booking.provider_name
                ? "No price was set for this earlier appointment."
                : "The exact price is confirmed after acceptance."}
            </Text>
          )}
          <AppointmentActions
            booking={booking}
            onChanged={async () => setBookings((await listBookings()).bookings)}
          />
          {[
            "searching",
            "payment_pending",
            "confirmed",
            "en_route",
            "arrived",
          ].includes(booking.status) ? (
            <Button
              secondary
              title="Cancel request"
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  await cancelBooking(booking.id);
                  setBookings((await listBookings()).bookings);
                })
              }
            />
          ) : null}
        </Card>
      ))}
    </Page>
  );
}
