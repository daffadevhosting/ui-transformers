export async function streamAndRenderAI(response, onChunk, onDone) {
  try {
    const { result } = await response.json();

    let i = 0;
    const delay = 2; // ms per karakter

    const interval = setInterval(() => {
      if (i < result.length) {
        onChunk(result[i]);
        i++;
      } else {
        clearInterval(interval);
        if (onDone) onDone();
      }
    }, delay);
  } catch (err) {
    console.error("❌ Gagal parse JSON AI response:", err);
    onChunk("❌ Terjadi kesalahan saat membaca hasil AI.");
  }
}
