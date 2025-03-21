/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

import { NextResponse } from "next/server";
import Together from "together-ai";
import { z } from "zod";

let ratelimit: Ratelimit | undefined;

if (process.env.UPSTASH_REDIS_REST_URL) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(100, "1440 m"),
    analytics: true,
    prefix: "keystrokeimagen",
  });
}

export async function POST(req: Request) {
  const json = await req.json();
  const { prompt, userAPIKey, iterativeMode } = z
    .object({
      prompt: z.string(),
      iterativeMode: z.boolean(),
      userAPIKey: z.string().optional(),
    })
    .parse(json);

  const options: ConstructorParameters<typeof Together>[0] = {};

  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-BYOK": userAPIKey ? "true" : "false",
    };
  }

  const client = new Together(options);

  if (userAPIKey) {
    client.apiKey = userAPIKey;
  }

  if (ratelimit && !userAPIKey) {
    const identifier = getIPAddress();

    const { success } = await ratelimit.limit(await identifier);

    if (!success) {
      return NextResponse.json(
        "No requests left. Please add your own API Key or try again in 24h",
        {
          status: 429,
        }
      );
    }
  }

  let response;

  try {
    response = await client.images.create({
      prompt,
      model: "black-forest-labs/FLUX.1-schnell",
      width: 1024,
      height: 768,
      seed: iterativeMode ? 123 : undefined,
      steps: 3,
      response_format: "base64",
    });
  } catch (e: any) {
    return Response.json(
      {
        error: e.toString(),
      },
      { status: 500 }
    );
  }

  return Response.json(response.data[0]);
}

async function getIPAddress() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = (await headers()).get("x-forwarded-for")

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return (await headers()).get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
}