import React from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

export default function ServiceCheckboxes({
  options,
  selected,
  onChange,
}: {
  options: { code: string; label: string }[];
  selected: string[];
  onChange: (services: string[]) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 16, color: "#0B2545" }}>
        Select 1–3 services · {selected.length} of 3 selected
      </Text>
      {options.map((option) => {
        const checked = selected.includes(option.code);
        const disabled = !checked && selected.length >= 3;
        return (
          <Pressable
            key={option.code}
            accessibilityRole="checkbox"
            accessibilityLabel={option.label}
            aria-checked={checked}
            aria-disabled={disabled}
            disabled={disabled}
            onPress={() => {
              if (checked)
                onChange(selected.filter((code) => code !== option.code));
              else if (selected.length < 3)
                onChange([...selected, option.code]);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              minHeight: 52,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: checked ? "#138A8A" : "#D9DDE3",
              backgroundColor: checked ? "#E6F4F4" : "#FFFFFF",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderWidth: 2,
                borderColor: "#138A8A",
                borderRadius: 5,
                backgroundColor: checked ? "#138A8A" : "white",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {checked ? <Check size={18} color="white" /> : null}
            </View>
            <Text style={{ flex: 1, fontSize: 16, color: "#0B2545" }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
      {selected.length === 3 ? (
        <Text accessibilityLiveRegion="polite" style={{ color: "#707588" }}>
          Three services selected. Uncheck one to choose another.
        </Text>
      ) : null}
    </View>
  );
}
