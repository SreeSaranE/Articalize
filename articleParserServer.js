const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const app = express();

app.get('/parse-article', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const words = article.textContent.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200); // 200 words per minute

    res.json({
      title: article.title,
      content: article.textContent,
      wordCount: words,
      readingTime,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse article.' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
