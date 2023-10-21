const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT ?? 8080;

app.get('/api/robing', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(path.resolve(path.join(__dirname, '..', 'data', 'data.json')), 'utf8'));
        res.json(data);
    } catch (e) {
        res.json({
            status: 'fail',
            message: 'rip bozo',
            fail: true,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server started listening on port ${PORT}.`);
});








