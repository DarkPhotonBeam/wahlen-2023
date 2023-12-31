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

const indexPath = path.resolve(path.join(__dirname, '..', 'client', 'dist'));
app.use('/', express.static(indexPath));
console.log(indexPath);
const assetsPath = path.resolve(path.join(__dirname, '..', 'client', 'dist', 'assets'));
console.log(assetsPath);
app.use('/assets', express.static(assetsPath));



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

app.get('/api/wahlen-2023-11-19', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(path.resolve(path.join(__dirname, '..', 'data', 'data2.json')), 'utf8'));
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








