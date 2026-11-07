import { Place } from "@/lib/marketplace/api";
export type MapProps = {
  value: Place | null;
  radiusKm?: number;
  onChange: (place: Place) => void;
};
