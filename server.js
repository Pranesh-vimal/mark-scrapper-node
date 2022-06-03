const express = require("express");
const app = express();
const cors = require("cors");
const rp = require("request-promise");
const cheerio = require("cheerio");
require("dotenv").config();
const morgan = require("morgan");
const extendTimeoutMiddleware = require("./middleware/extendTimeoutMiddleware");
const api = require("./routes/api");

var port = process.env.PORT || 8000;

app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);

app.use(morgan("dev"));

app.use('/api', api);

app.use(function (req, res, next) {
    //Capture All 404 errors
    res.status(404).json({
        error: "Not Found",
    });
});

app.use(extendTimeoutMiddleware);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
