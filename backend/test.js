// test-minimal.js
import express from 'express';

const app = express();
const port = 5000;

// Absolutely minimal - no middleware at all
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Minimal server works!' });
});

app.listen(port, () => {
  console.log(`✅ Minimal test server running on port ${port}`);
});