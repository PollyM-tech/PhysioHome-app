# PhysioHome App

PhysioHome is a mobile-first home physiotherapy service application built with React Native and Expo. The app is being developed as a healthcare service platform where patients can access physiotherapy care at home, book sessions, view providers, manage bookings, and interact with the service through a clean mobile interface.

This README documents the project setup and development work completed so far. Product documentation and brand guidelines are maintained separately inside the project documentation files and are not repeated here.

---

## Project Status

Current status: **Initial app setup and folder organization**

At this stage, the project has been prepared for app development. The default Expo Router starter structure has been cleaned up, the app routing has been reorganized, brand assets have been added, and base project folders have been created for scalable development.

---

## Tech Stack

The project currently uses:

- React Native
- Expo
- Expo Router
- TypeScript
- VS Code
- Node.js / npm

Planned project direction includes mobile-first development with structured patient, physiotherapist, and authentication flows.

---

## Prerequisites

Before running this project, ensure the following are installed:

- Node.js LTS
- npm
- Git
- VS Code
- Expo Go app on your Android or iOS device

Check your Node and npm versions:

```bash
node -v
npm -v

Expo Go

Install Expo Go on your mobile device from the Play Store or App Store. Expo Go is used to preview the app during development.

Recommended VS Code Extensions

Install the following VS Code extensions to make development easier:

ES7+ React/Redux/React-Native snippets
Prettier - Code formatter
ESLint
React Native Tools
Material Icon Theme
GitLens

Main Dependency File
For this React Native/Expo project, the main dependency file is: 
package.json

Packages and Dependencies Installed or Prepared So Far

The project was created with Expo, so several core packages already exist through the starter setup.

Expected core dependencies include:

expo
expo-router
react
react-dom
react-native
react-native-web
typescript

Additional recommended packages for this project include:

npm install lucide-react-native
npx expo install expo-linear-gradient
npx expo install expo-image
npx expo install expo-font
npx expo install react-native-safe-area-context
npx expo install react-native-screens

project location - physiohome-app

Running the app - npx expo start 
to clear cache and start npx expo start -c

TypeScript Check

To check for TypeScript errors:

npx tsc --noEmit

Current App Flow
The app currently follows this basic route flow:
App opens
  ↓
app/index.tsx
  ↓
Redirects to onboarding
  ↓
app/onboarding.tsx
  ↓
Get Started button
  ↓
app/patient/home.tsx

Authentication Screens
app/auth/login.tsx
app/auth/signup.tsx

# PhysioHome-app


Use Convex only for:

Database
Backend functions
Real-time app data
Authentication connection
Bookings
Profiles
Payments 

Backend/database/functions → Convex Cloud
Authentication → WorkOS AuthKit with Convex integration