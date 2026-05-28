import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

type LogoVariant = "default" | "dark";

type LogoProps = {
  variant?: LogoVariant;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function Logo({
  variant = "default",
  width = 190,
  height = 72,
  style,
}: LogoProps) {
  const logoSource =
    variant === "dark"
      ? require("../../assets/logo/physiohome-logo-dark.png")
      : require("../../assets/logo/physiohome-logo.png");

  return (
    <Image
      source={logoSource}
      style={[
        {
          width,
          height,
          resizeMode: "contain",
        },
        style,
      ]}
    />
  );
}
