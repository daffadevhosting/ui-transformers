export async function streamAndRenderAI(response, onChunk) {
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");

    buffer = chunks.pop();

    chunks.forEach((chunk) => {
      if (!chunk.trim() || chunk.trim() === "data: [DONE]") return;

      try {
        const raw = chunk.replace(/^data:\s*/, "");
        const json = JSON.parse(raw);
        const text = json.response || "";

        if (text) onChunk(text);
      } catch (err) {
        console.warn("❌ Gagal parse JSON chunk:", err, chunk);
      }
    });
  }
}
