import fetch from "node-fetch";

export async function postEvaluationWithRetry(url, payload) {
  let delay = 2000;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log("✅ Evaluation ping success");
      return;
    }
    console.warn(`Attempt ${i + 1} failed (${res.status}), retrying...`);
    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }
  throw new Error("Failed to POST evaluation after retries.");
}
