import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  createHash,
} from "crypto";


export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";


const supabase =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,

    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );


const supportedLanguages =
  new Set([
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
  ]);


function createTextHash(
  text: string
) {
  return createHash(
    "sha256"
  )
    .update(
      text,
      "utf8"
    )
    .digest("hex");
}


function splitByUtf8Bytes(
  text: string,
  maxBytes = 450
) {
  const chunks: string[] =
    [];

  let current = "";

  for (const char of text) {
    const next =
      current + char;

    if (
      Buffer.byteLength(
        next,
        "utf8"
      ) > maxBytes
    ) {
      if (current) {
        chunks.push(
          current
        );
      }

      current =
        char;
    } else {
      current =
        next;
    }
  }

  if (current) {
    chunks.push(
      current
    );
  }

  return chunks;
}


function decodeBasicEntities(
  text: string
) {
  return text
    .replace(
      /&quot;/g,
      '"'
    )
    .replace(
      /&#39;/g,
      "'"
    )
    .replace(
      /&lt;/g,
      "<"
    )
    .replace(
      /&gt;/g,
      ">"
    )
    .replace(
      /&amp;/g,
      "&"
    );
}


async function translateChunk(
  text: string,
  source: string,
  target: string
) {
  const url =
    new URL(
      "https://api.mymemory.translated.net/get"
    );


  url.searchParams.set(
    "q",
    text
  );

  url.searchParams.set(
    "langpair",
    `${source}|${target}`
  );

  url.searchParams.set(
    "mt",
    "1"
  );


  const email =
    process.env
      .MYMEMORY_EMAIL;


  if (email) {
    url.searchParams.set(
      "de",
      email
    );
  }


  const response =
    await fetch(
      url.toString(),
      {
        cache:
          "no-store",
      }
    );


  const rawText =
    await response.text();


  if (!response.ok) {
    throw new Error(
      "Translation service request failed."
    );
  }


  let data: any;


  try {
    data =
      JSON.parse(
        rawText
      );
  } catch {
    throw new Error(
      "Translation service returned an invalid response."
    );
  }


  if (
    data.responseStatus &&
    Number(
      data.responseStatus
    ) !== 200
  ) {
    throw new Error(
      data.responseDetails ||
        "Translation failed."
    );
  }


  const translatedText =
    data?.responseData
      ?.translatedText;


  if (
    typeof translatedText !==
    "string"
  ) {
    throw new Error(
      "Translation result was empty."
    );
  }


  return decodeBasicEntities(
    translatedText
  );
}


async function findCachedTranslation(
  hash: string,
  source: string,
  target: string
) {
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
      hash
    )
    .eq(
      "source_language",
      source
    )
    .eq(
      "target_language",
      target
    )
    .maybeSingle();


  if (error) {
    console.error(
      "Translation cache read error:",
      error
    );

    return null;
  }


  if (
    !data ||
    typeof data.translated_text !==
      "string"
  ) {
    return null;
  }


  return data.translated_text;
}


async function saveTranslationToCache(
  hash: string,
  text: string,
  source: string,
  target: string,
  translatedText: string
) {
  const {
    error,
  } = await supabase
    .from(
      "translation_cache"
    )
    .upsert(
      {
        source_hash:
          hash,

        source_text:
          text,

        source_language:
          source,

        target_language:
          target,

        translated_text:
          translatedText,
      },
      {
        onConflict:
          "source_hash,source_language,target_language",

        ignoreDuplicates:
          true,
      }
    );


  if (error) {
    console.error(
      "Translation cache save error:",
      error
    );
  }
}


export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();


    const text =
      typeof body.text ===
      "string"
        ? body.text.trim()
        : "";


    const source =
      typeof body.source ===
      "string"
        ? body.source
        : "";


    const target =
      typeof body.target ===
      "string"
        ? body.target
        : "";


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
      text.length > 3000
    ) {
      return NextResponse.json(
        {
          error:
            "Text is too long.",
        },
        {
          status: 400,
        }
      );
    }


    if (
      !supportedLanguages.has(
        source
      ) ||
      !supportedLanguages.has(
        target
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported language.",
        },
        {
          status: 400,
        }
      );
    }


    if (
      source === target
    ) {
      return NextResponse.json(
        {
          translatedText:
            text,

          cached:
            true,
        }
      );
    }


    const hash =
      createTextHash(
        text
      );


    // =================================
    // 1. SUPABASE CACHE CHECK
    // =================================

    const cachedTranslation =
      await findCachedTranslation(
        hash,
        source,
        target
      );


    if (
      cachedTranslation
    ) {
      console.log(
        `Translation cache HIT: ${source} -> ${target}`
      );


      return NextResponse.json(
        {
          translatedText:
            cachedTranslation,

          cached:
            true,
        }
      );
    }


    // =================================
    // 2. TRANSLATION API
    // =================================

    console.log(
      `Translation cache MISS: ${source} -> ${target}`
    );


    const chunks =
      splitByUtf8Bytes(
        text
      );


    const results:
      string[] = [];


    for (
      const chunk
      of chunks
    ) {
      const translated =
        await translateChunk(
          chunk,
          source,
          target
        );


      results.push(
        translated
      );
    }


    const translatedText =
      results.join("");


    // =================================
    // 3. SAVE CACHE
    // =================================

    await saveTranslationToCache(
      hash,
      text,
      source,
      target,
      translatedText
    );


    return NextResponse.json(
      {
        translatedText,

        cached:
          false,
      }
    );
  } catch (error) {
    console.error(
      "Translation API error:",
      error
    );


    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Translation failed.",
      },
      {
        status: 500,
      }
    );
  }
}