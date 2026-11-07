const { expo } = require("./app.json");

module.exports = () => ({
  ...expo,
  extra: {
    ...expo.extra,
    ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID
      ? { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } }
      : {}),
  },
  ios: {
    ...expo.ios,
    ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY
      ? {
          config: {
            ...expo.ios.config,
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY,
          },
        }
      : {}),
  },
  android: {
    ...expo.android,
    ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY
      ? {
          config: {
            ...expo.android.config,
            googleMaps: {
              apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY,
            },
          },
        }
      : {}),
  },
});
