import { NextResponse } from "next/server";
import { z } from "zod";

const directionsSchema = z.object({
  originLat: z.coerce.number().min(-90).max(90),
  originLng: z.coerce.number().min(-180).max(180),
  destinationLat: z.coerce.number().min(-90).max(90),
  destinationLng: z.coerce.number().min(-180).max(180)
});

type OsrmStep = {
  distance?: number;
  duration?: number;
  name?: string;
  maneuver?: {
    location?: [number, number];
    modifier?: string;
    type?: string;
  };
};

export async function GET(request: Request) {
  const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = directionsSchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid route coordinates" }, { status: 400 });
  }

  const { originLat, originLng, destinationLat, destinationLng } = parsed.data;
  const baseUrl = process.env.OSRM_ROUTE_URL ?? "https://router.project-osrm.org/route/v1";
  const coordinates = `${originLng},${originLat};${destinationLng},${destinationLat}`;
  const url = `${baseUrl}/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) {
      return NextResponse.json({ error: "Routing service is unavailable right now" }, { status: 502 });
    }

    const json = await response.json();
    const route = json.routes?.[0];
    if (!route?.geometry?.coordinates?.length) {
      return NextResponse.json({ error: "No street route found for these points" }, { status: 404 });
    }

    const steps = (route.legs?.[0]?.steps ?? []).map((step: OsrmStep) => ({
      instruction: formatInstruction(step),
      name: step.name || "road",
      distanceMeters: Math.round(step.distance ?? 0),
      durationSeconds: Math.round(step.duration ?? 0),
      type: step.maneuver?.type ?? "continue",
      modifier: step.maneuver?.modifier ?? null,
      location: step.maneuver?.location
        ? { latitude: step.maneuver.location[1], longitude: step.maneuver.location[0] }
        : null
    }));

    return NextResponse.json({
      provider: "OSRM",
      distanceMeters: Math.round(route.distance ?? 0),
      durationSeconds: Math.round(route.duration ?? 0),
      points: route.geometry.coordinates.map(([longitude, latitude]: [number, number]) => ({ latitude, longitude })),
      steps
    });
  } catch {
    return NextResponse.json({ error: "Unable to connect to the routing service" }, { status: 502 });
  }
}

function formatInstruction(step: OsrmStep) {
  const type = step.maneuver?.type ?? "continue";
  const modifier = readableModifier(step.maneuver?.modifier);
  const road = step.name || "the road";

  if (type === "depart") return `Head ${modifier || "out"} on ${road}`;
  if (type === "arrive") return "Arrive at your destination";
  if (type === "turn") return `Turn ${modifier || ""}${modifier ? " " : ""}onto ${road}`;
  if (type === "new name") return `Continue onto ${road}`;
  if (type === "merge") return `Merge ${modifier || ""}${modifier ? " " : ""}onto ${road}`;
  if (type === "on ramp") return `Take the ramp ${modifier || ""}${modifier ? " " : ""}onto ${road}`;
  if (type === "off ramp") return `Take the exit ${modifier || ""}${modifier ? " " : ""}toward ${road}`;
  if (type === "roundabout" || type === "rotary") return `Enter the roundabout toward ${road}`;
  if (type === "fork") return `Keep ${modifier || "going"} toward ${road}`;

  return `Continue on ${road}`;
}

function readableModifier(modifier?: string) {
  if (!modifier) return "";
  return modifier.replaceAll("-", " ");
}
