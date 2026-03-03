import { NextResponse } from "next/server";

interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function POST(request: Request) {
  try {
    const { address } = (await request.json()) as { address?: string };

    if (!address || address.trim().length === 0) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured." },
        { status: 500 }
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to call geocoding API." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      status: string;
      results?: { geometry: { location: GeocodeResult } }[];
    };

    if (data.status !== "OK" || !data.results?.length) {
      return NextResponse.json(
        { error: "No geocoding result.", status: data.status },
        { status: 404 }
      );
    }

    const { lat, lng } = data.results[0].geometry.location;

    return NextResponse.json({ lat, lng });
  } catch (e) {
    console.error("Geocode API error:", e);
    return NextResponse.json(
      { error: "Unexpected error while geocoding." },
      { status: 500 }
    );
  }
}

