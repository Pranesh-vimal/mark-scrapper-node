const express = require("express");
const app = express();
const cors = require("cors");
const rp = require("request-promise");
const cheerio = require("cheerio");
require("dotenv").config();
const morgan = require("morgan");
const extendTimeoutMiddleware = require("./middleware/extendTimeoutMiddleware");

app.use(express.json());

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
    })
);

app.use(morgan("dev"));

app.post("/api/upload", async (req, res) => {
    const { data, rollNoColumn, nameColumn, dobColumn } = req.body;

    if (!data || !rollNoColumn || !nameColumn || !dobColumn) {
        res.status(400).send("Invalid request");
        return;
    }

    let result = [];
    let headings = ['Name', 'RollNo', 'GPA', 'CGPA'];

    let students = Object.values(data);

    for (let i = 0; i < students.length; i++) {
        let student = Object.values(students[i]);

        let marks = {};

        marks['Name'] = student[nameColumn];
        marks['RollNo'] = (student[rollNoColumn]);
        marks['GPA'] = '';
        marks['CGPA'] = '';

        await rp
            .post(process.env.RESULT_URL, {
                form: {
                    regno: student[rollNoColumn],
                    dob: student[dobColumn],
                },
            })
            .then(function (res) {
                //success!
                var html = res.replace("/<!--(.|s)*?--!>/", "");
                var $ = cheerio.load(html);
                var table = $("[name=result]");
                var tr = table.find("tr");
                for (var i = 1; i < tr.length; i++) {
                    var td = tr.eq(i).find("td");
                    var th = tr.eq(i).find("th");
                    marks[td.eq(2).text()] = th.eq(1).text();

                    if (headings.indexOf(td.eq(2).text()) == -1) {
                        headings.push(td.eq(2).text());
                    }
                }

                var gradeTable = $("table:last-child");
                var tr = gradeTable.find("tr > th > font > font");
                marks['GPA'] = tr.eq(0).text();
                marks['CGPA'] = tr.eq(1).text();
            })
            .catch(function (err) {
                //handle error
            });
        result.push(marks);
        console.log(marks);
    }

    res.status(200).json({
        result,
        headings,
    });
});

app.use(function (req, res, next) {
    //Capture All 404 errors
    res.status(404).json({
        error: "Not Found",
    });
});

app.use(extendTimeoutMiddleware);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
