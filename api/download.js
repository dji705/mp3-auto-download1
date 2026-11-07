export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
    const name = typeof req.query.name === "string" ? req.query.name : "audio.mp3";
    const source = new URL(rawUrl);

    // Only allow the MP3 host and directory used by this page.
    if (
      source.protocol !== "https:" ||
      source.hostname !== "galei-israel-od.streamgates.net" ||
      !source.pathname.startsWith("/Galei_Israel_OD/Audio/") ||
      !source.pathname.toLowerCase().endsWith(".mp3")
    ) {
      return res.status(400).send("Invalid audio URL");
    }

    const upstream = await fetch(source.toString());
    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status || 502).send("Could not fetch audio file");
    }

    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "audio.mp3";
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    res.setHeader("Cache-Control", "no-store");

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Length", String(buffer.length));
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(400).send("Invalid request");
  }
}