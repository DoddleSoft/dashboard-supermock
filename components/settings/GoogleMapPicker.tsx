"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";

interface GoogleMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

declare global {
  interface Window {
    initGoogleMaps?: () => void;
  }
}

const DEFAULT_LAT = 23.8103;
const DEFAULT_LNG = 90.4125;

export default function GoogleMapPicker({
  latitude,
  longitude,
  address,
  onLocationChange,
}: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [manualLat, setManualLat] = useState(latitude?.toString() ?? "");
  const [manualLng, setManualLng] = useState(longitude?.toString() ?? "");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const lat = latitude ?? DEFAULT_LAT;
  const lng = longitude ?? DEFAULT_LNG;

  // Load Google Maps Script
  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      // Script tag exists but google isn't loaded yet — wait for it
      const check = setInterval(() => {
        if (window.google?.maps) {
          setMapLoaded(true);
          clearInterval(check);
        }
      }, 100);
      return () => clearInterval(check);
    }

    window.initGoogleMaps = () => setMapLoaded(true);

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete window.initGoogleMaps;
    };
  }, [apiKey]);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // If already initialized and the container is the same, skip
    if (mapInstance.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
      mapId: "settings-map",
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat, lng },
      gmpDraggable: true,
      title: "Center Location",
    });

    marker.addListener("dragend", () => {
      const pos = marker.position;
      if (pos) {
        const newLat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
        const newLng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
        reverseGeocode(newLat, newLng);
      }
    });

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        marker.position = { lat: newLat, lng: newLng };
        reverseGeocode(newLat, newLng);
      }
    });

    mapInstance.current = map;
    markerInstance.current = marker;

    return () => {
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, [mapLoaded]);

  // Update marker when props change
  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current) return;
    const pos = { lat, lng };
    markerInstance.current.position = pos;
    mapInstance.current.panTo(pos);
  }, [lat, lng]);

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!window.google?.maps) {
        onLocationChange(lat, lng, address);
        return;
      }
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (
          results: google.maps.GeocoderResult[] | null,
          status: google.maps.GeocoderStatus,
        ) => {
          if (status === "OK" && results?.[0]) {
            onLocationChange(lat, lng, results[0].formatted_address);
          } else {
            onLocationChange(lat, lng, address);
          }
        },
      );
    },
    [address, onLocationChange],
  );

  const handleSearch = async () => {
    if (!searchQuery.trim() || !window.google?.maps) return;
    setSearching(true);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: searchQuery },
      (
        results: google.maps.GeocoderResult[] | null,
        status: google.maps.GeocoderStatus,
      ) => {
        setSearching(false);
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          const newLat = loc.lat();
          const newLng = loc.lng();

          if (markerInstance.current) {
            markerInstance.current.position = { lat: newLat, lng: newLng };
          }
          if (mapInstance.current) {
            mapInstance.current.panTo({ lat: newLat, lng: newLng });
            mapInstance.current.setZoom(16);
          }
          onLocationChange(newLat, newLng, results[0].formatted_address);
        }
      },
    );
  };

  const handleManualUpdate = () => {
    const parsedLat = parseFloat(manualLat);
    const parsedLng = parseFloat(manualLng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) return;
    if (
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    )
      return;

    if (markerInstance.current) {
      markerInstance.current.position = { lat: parsedLat, lng: parsedLng };
    }
    if (mapInstance.current) {
      mapInstance.current.panTo({ lat: parsedLat, lng: parsedLng });
      mapInstance.current.setZoom(16);
    }
    reverseGeocode(parsedLat, parsedLng);
  };

  // No API key — fallback UI
  if (!apiKey) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          Add <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
          to your .env to enable the interactive map.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="23.8103"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="90.4125"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={handleManualUpdate}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
        >
          Update Location
        </button>

        {latitude && longitude && (
          <div className="rounded-lg overflow-hidden border border-slate-200">
            <iframe
              title="Center Location"
              width="100%"
              height="250"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for an address..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          Locate
        </button>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-[300px] rounded-lg border border-slate-200 bg-slate-100"
      />

      {/* Coordinates display */}
      <div className="flex items-center gap-3 text-md text-slate-500">
        <span>
          Lat: <strong className="text-slate-700">{lat.toFixed(6)}</strong>
        </span>
        <span>
          Lng: <strong className="text-slate-700">{lng.toFixed(6)}</strong>
        </span>
      </div>

      <p className="text-sm text-slate-400">
        Click on the map or drag the marker to set the location.
      </p>
    </div>
  );
}
