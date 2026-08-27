export type GeocodeSuggestion = {
  id: string;
  place_name: string;
  lat: number;
  lng: number;
  context?: Array<{ id: string; text: string }>;
};

export type GeocodeResponse = {
  data: GeocodeSuggestion[];
  error?: string;
};
