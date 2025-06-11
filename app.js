
// app.js
const path    = require('path');
const express = require('express');
const app     = express();
const port    = process.env.PORT || 3000;

// Servera ALLT i roten (/index.html, /script.js, /data.json osv)
app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
  console.log(`Servern körs på port ${port}`);
});
