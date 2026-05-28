import React from "react";
import { Link } from "expo-router";
import { SafeAreaView, View, Text, Pressable, Image } from "react-native";
import {
  ShieldCheck,
  House,
  CalendarDays,
  ArrowRight,
} from "lucide-react-native";

import { Logo } from "../components/common/Logo";
import { colors } from "../constants/colors";

export default function OnboardingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-physio-cream">
      <View className="flex-1 bg-physio-cream">
        {/* Top Section */}
        <View className="flex-row items-center justify-between px-6 pt-2">
          <View />
          <Pressable>
            <Text className="text-base font-bold text-physio-teal">Skip</Text>
          </Pressable>
        </View>

        {/* Logo */}
        <View className="mt-2 items-center">
          <Logo width={180} height={70} />
        </View>

        {/* Heading */}
        <View className="mt-2 items-center px-7">
          <Text className="text-center text-[34px] font-extrabold leading-[40px] text-physio-navy">
            Professional Physiotherapy{" "}
            <Text className="text-physio-teal">at Home</Text>
          </Text>

          <Text className="mt-3 max-w-[320px] text-center text-base font-medium leading-6 text-physio-navy/85">
            Book trusted physiotherapists to help you heal, recover and live
            pain-free.
          </Text>
        </View>

        {/* Hero Image */}
        <View className="mt-5 px-[18px]">
          <Image
            source={require("../assets/images/hero.png")}
            className="h-[320px] w-full rounded-[22px]"
            resizeMode="cover"
          />
        </View>

        {/* Bottom Card */}
        <View className="mt-5 flex-1 rounded-t-[28px] bg-white px-5 pb-5 pt-6">
          <View className="flex-row justify-between gap-3">
            <FeatureItem
              icon={<ShieldCheck size={28} color={colors.primaryTeal} />}
              label="Verified Experts"
            />

            <FeatureItem
              icon={<House size={28} color={colors.primaryTeal} />}
              label="Care at Home"
            />

            <FeatureItem
              icon={<CalendarDays size={28} color={colors.primaryTeal} />}
              label="Easy Booking"
            />
          </View>

          <Link href="/auth/signup" asChild>
            <Pressable className="mt-8 h-[58px] flex-row items-center justify-between rounded-[22px] bg-physio-teal px-7">
              <Text className="text-lg font-extrabold text-white">
                Get Started
              </Text>
              <ArrowRight size={24} color={colors.white} />
            </Pressable>
          </Link>

          <View className="mt-5 flex-row items-center justify-center">
            <Text className="text-[15px] font-medium text-physio-slate">
              Already have an account?{" "}
            </Text>

            <Link href="/auth/login" asChild>
              <Pressable>
                <Text className="text-[15px] font-bold text-physio-teal">
                  Log in
                </Text>
              </Pressable>
            </Link>
          </View>

          <View className="mt-5 flex-row items-center justify-center gap-2.5">
            <View className="h-3 w-3 rounded-full bg-physio-teal" />
            <View className="h-2.5 w-2.5 rounded-full bg-physio-gray" />
            <View className="h-2.5 w-2.5 rounded-full bg-physio-gray" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

type FeatureItemProps = {
  icon: React.ReactNode;
  label: string;
};

function FeatureItem({ icon, label }: FeatureItemProps) {
  return (
    <View className="flex-1 items-center">
      <View className="mb-3 h-16 w-16 items-center justify-center rounded-[18px] bg-physio-aqua">
        {icon}
      </View>

      <Text className="text-center text-sm font-semibold leading-5 text-physio-navy">
        {label}
      </Text>
    </View>
  );
}
