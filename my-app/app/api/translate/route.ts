import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const SUPPORTED_LANGUAGES = [
  "en",
  "ko",
  "es",
  "fr",
  "it",
  "pt",
  "de",
  "pl",
  "ja",
  "zh",
] as const;

function normalizeLanguage(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase();
}

function isSupportedLanguage(language: string) {
  return SUPPORTED_LANGUAGES.includes(
    language as (typeof SUPPORTED_LANGUAGES)[number]
  );
}

function getMyMemoryLanguage(language: string) {
  if (language === "zh") {
    return "zh-CN";
  }

  return language;
}

function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(
    url,
    key
  );
}

function createTextHash(text: string) {
  return createHash("sha256")
    .update(text)
    .digest("hex");
}

function splitTextByBytes(
  text: string,
  maxBytes = 450
) {
  const chunks: string[] = [];

  let current = "";

  for (const character of text) {
    const candidate =
      current + character;

    if (
      Buffer.byteLength(
        candidate,
        "utf8"
      ) > maxBytes
    ) {
      if (current) {
        chunks.push(current);
      }

      current =
        character;
    } else {
      current =
        candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function translateChunk(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
) {
  const source =
    getMyMemoryLanguage(
      sourceLanguage
    );

  const target =
    getMyMemoryLanguage(
      targetLanguage
    );

  const params =
    new URLSearchParams({
      q: text,
      langpair: `${source}|${target}`,
    });

  const response =
    await fetch(
      `https://api.mymemory.translated.net/get?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  const raw =
    await response.text();

  if (!response.ok) {
    console.error(
      "MyMemory HTTP error:",
      response.status,
      raw.slice(0, 300)
    );

    throw new Error(
      `Translation API HTTP ${response.status}`
    );
  }

  let data: any;

  try {
    data =
      JSON.parse(raw);
  } catch {
    console.error(
      "MyMemory invalid JSON:",
      raw.slice(0, 300)
    );

    throw new Error(
      "Translation API returned invalid JSON"
    );
  }

  const translatedText =
    data?.responseData
      ?.translatedText;

  if (
    typeof translatedText !==
      "string" ||
    !translatedText.trim()
  ) {
    console.error(
      "MyMemory empty response:",
      data
    );

    throw new Error(
      "Translation result is empty"
    );
  }

  return translatedText;
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const text =
      typeof body?.text ===
      "string"
        ? body.text.trim()
        : "";

    const sourceLanguage =
      normalizeLanguage(
        body?.sourceLanguage ??
          body?.source_language ??
          body?.source
      );

    const targetLanguage =
      normalizeLanguage(
        body?.targetLanguage ??
          body?.target_language ??
          body?.target
      );

    if (!text) {
      return NextResponse.json(
        {
          error:
            "Text is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isSupportedLanguage(
        sourceLanguage
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported source language.",
          received:
            sourceLanguage,
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isSupportedLanguage(
        targetLanguage
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported target language.",
          received:
            targetLanguage,
        },
        {
          status: 400,
        }
      );
    }

    if (
      sourceLanguage ===
      targetLanguage
    ) {
      return NextResponse.json({
        translatedText:
          text,
        cached: false,
      });
    }

    const supabase =
      getSupabase();

    const sourceHash =
      createTextHash(text);

    /*
     * TRANSLATION CACHE CHECK
     */

    if (supabase) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "translation_cache"
        )
        .select(
          "translated_text"
        )
        .eq(
          "source_hash",
          sourceHash
        )
        .eq(
          "source_language",
          sourceLanguage
        )
        .eq(
          "target_language",
          targetLanguage
        )
        .maybeSingle();

      if (error) {
        console.log(
          "Translation cache read skipped:",
          error.message
        );
      }

      if (
        data?.translated_text
      ) {
        return NextResponse.json({
          translatedText:
            data.translated_text,
          cached: true,
        });
      }
    }

    /*
     * TRANSLATE
     */

    const chunks =
      splitTextByBytes(text);

    const translatedParts: string[] =
      [];

    for (const chunk of chunks) {
      const translated =
        await translateChunk(
          chunk,
          sourceLanguage,
          targetLanguage
        );

      translatedParts.push(
        translated
      );
    }

    const translatedText =
      translatedParts.join("");

    /*
     * CACHE SAVE
     */

    if (supabase) {
      const {
        error,
      } = await supabase
        .from(
          "translation_cache"
        )
        .insert({
          source_hash:
            sourceHash,

          source_text:
            text,

          source_language:
            sourceLanguage,

          target_language:
            targetLanguage,

          translated_text:
            translatedText,
        });

      if (
        error &&
        error.code !==
          "23505"
      ) {
        console.log(
          "Translation cache save skipped:",
          error.message
        );
      }
    }

    return NextResponse.json({
      translatedText,
      cached: false,
    });
  } catch (error) {
    console.error(
      "Translation route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Translation failed.",
      },
      {
        status: 500,
      }
    );
  }
}