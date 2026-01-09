const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Explicitly serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Also allow serving the presentation build specifically if needed
app.use('/presentation', express.static(path.join(__dirname, 'presentation-build')));

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Presentation build available at http://localhost:${PORT}/presentation`);
});
