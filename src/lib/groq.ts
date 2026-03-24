export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" }),
    "audio.ogg"
  );
  formData.append("model", "whisper-large-v3");
  formData.append("language", "pt");
  formData.append("response_format", "text");

  const response = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData,
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    throw new Error(`Groq STT failed: ${response.status}`);
  }

  const text = await response.text();
  return text.trim();
}
