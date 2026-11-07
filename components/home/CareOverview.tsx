import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  ShieldCheck,
} from "lucide-react-native";

export default function CareOverview({
  onFind,
  onChoose,
  returning = false,
}: {
  onFind: () => void;
  onChoose: () => void;
  returning?: boolean;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  return (
    <View style={[s.overview, wide && s.wide]}>
      <View style={s.copy}>
        <View style={s.eyebrow}>
          <View style={s.dot} />
          <Text style={s.eyebrowText}>PHYSIOTHERAPY AT YOUR DOOR</Text>
        </View>
        <Text accessibilityRole="header" style={[s.title, wide && s.titleWide]}>
          Move better.{"\n"}Recover at home.
        </Text>
        <Text style={s.description}>
          Back or joint pain? Recovering from surgery? Find a verified
          physiotherapist who comes to you.
        </Text>
        <View style={s.priceRow}>
          <Text style={s.price}>From KES 2,000</Text>
          <Text style={s.priceDetail}>/ 60-minute session</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Check size={14} color="#087F83" />
          <Text style={s.included}>
            Travel within your provider’s area included
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onFind}
          style={({ pressed }) => [s.primary, pressed && s.pressed]}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.primaryTitle}>Find someone available</Text>
            <Text style={s.primaryDetail}>
              Match by care needs, location & budget
            </Text>
          </View>
          <ArrowRight color="white" size={22} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onChoose}
          style={({ pressed }) => [s.secondary, pressed && s.pressed]}
        >
          <Text style={s.secondaryTitle}>Choose a physiotherapist</Text>
          <ArrowRight color="#0B2545" size={19} />
        </Pressable>
        {!returning ? (
          <Text style={s.accountNote}>
            Create an account to request a visit.
          </Text>
        ) : null}
        <View style={s.trust}>
          <ShieldCheck size={16} color="#087F83" />
          <Text style={s.trustText}>Verified professionals</Text>
          <View style={s.trustDot} />
          <CalendarDays size={16} color="#087F83" />
          <Text style={s.trustText}>Now or scheduled</Text>
        </View>
        <View style={s.steps}>
          <Text style={s.stepsTitle}>Your visit, in 3 steps</Text>
          <View style={s.stepRow}>
            {[
              ["1", "Tell us what hurts"],
              ["2", "Confirm pin & budget"],
              ["3", "Get matched for a visit"],
            ].map(([number, label]) => (
              <View key={number} style={s.step}>
                <Text style={s.number}>{number}</Text>
                <Text style={s.stepText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      {wide ? (
        <View style={s.photoWrap}>
          <Image
            accessibilityLabel="A physiotherapist helping a patient exercise at home"
            source={require("@/assets/images/hero.png")}
            style={s.photo}
            resizeMode="cover"
          />
          <View style={s.photoNote}>
            <MapPin color="#087F83" size={22} />
            <View style={{ flex: 1 }}>
              <Text style={s.photoNoteTitle}>Care comes to you</Text>
              <Text style={s.photoNoteText}>
                Choose a pin. Find a professional who covers your area.
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  overview: { gap: 30 },
  wide: { flexDirection: "row", alignItems: "stretch", gap: 64 },
  copy: { flex: 1, gap: 12 },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { height: 7, width: 7, borderRadius: 4, backgroundColor: "#087F83" },
  eyebrowText: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "800",
    color: "#087F83",
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1.6,
    color: "#0B2545",
  },
  titleWide: { fontSize: 62, lineHeight: 66, letterSpacing: -2.4 },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5E6B",
    maxWidth: 450,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    columnGap: 7,
    rowGap: 4,
  },
  price: { fontSize: 23, fontWeight: "800", color: "#0B2545" },
  priceDetail: { fontSize: 13, color: "#536775" },
  included: { fontSize: 12, lineHeight: 18, color: "#087F83" },
  primary: {
    backgroundColor: "#087F83",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 72,
  },
  primaryTitle: { fontSize: 17, fontWeight: "800", color: "white" },
  primaryDetail: {
    fontSize: 12,
    lineHeight: 18,
    color: "#DEFAF5",
    marginTop: 3,
  },
  secondary: {
    borderColor: "#BDCFCC",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 52,
  },
  secondaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0B2545",
    flex: 1,
  },
  pressed: { opacity: 0.78 },
  accountNote: { fontSize: 12, lineHeight: 18, color: "#647580" },
  trust: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  trustText: { fontSize: 11, color: "#49616B" },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#819A9A",
    marginHorizontal: 3,
  },
  steps: {
    borderTopWidth: 1,
    borderTopColor: "#DCE6E2",
    paddingTop: 16,
    gap: 12,
    marginTop: 3,
  },
  stepsTitle: { fontSize: 13, color: "#0B2545", fontWeight: "700" },
  stepRow: { flexDirection: "row", gap: 10 },
  step: { flex: 1, gap: 6 },
  number: {
    width: 23,
    height: 23,
    borderRadius: 12,
    textAlign: "center",
    lineHeight: 23,
    fontSize: 12,
    fontWeight: "800",
    color: "#087F83",
    backgroundColor: "#DCEDE8",
  },
  stepText: { fontSize: 11, lineHeight: 16, color: "#425C68", maxWidth: 120 },
  photoWrap: {
    flex: 0.95,
    minHeight: 560,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#E3D8C8",
  },
  photo: { width: "100%", height: "100%", position: "absolute" },
  photoNote: {
    position: "absolute",
    bottom: 22,
    left: 22,
    right: 22,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFFF2",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  photoNoteTitle: { fontSize: 17, fontWeight: "800", color: "#0B2545" },
  photoNoteText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#536775",
    marginTop: 4,
  },
});
