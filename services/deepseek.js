export const getArticleSummary = async (url) => {
  const response = await fetch("https://api.deepseek.com/summarize", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  const data = await response.json();
  return data.summary;
};
