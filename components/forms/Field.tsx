import React from "react";
import { Text, TextInput, View, TextInputProps } from "react-native";
import { fieldStyle } from "@/components/marketplace/Primitives";
export default function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: "#0B2545", fontWeight: "600" }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        {...props}
        style={[
          fieldStyle,
          props.multiline ? { minHeight: 85, textAlignVertical: "top" } : null,
          props.style,
        ]}
      />
    </View>
  );
}
