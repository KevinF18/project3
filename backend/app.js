const express = require("express");
const cors = require("cors");
const mysql = require("mysql");

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());

var con = mysql.createConnection({
  host: "localhost",
  port: 13313,
  user: "root",
  password: "example",
  database: "assign",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

app.get("/api/data", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 25;

  const offset = (page - 1) * pageSize;

  const filters = req.query.filters || [];

  let whereClauses = [];
  let categoryClauses = [];
  let currentFilter = null;

  filters.forEach((filter) => {
    const { type, value } = filter;
    if (type && value) {
      if (type === "category") {
        categoryClauses.push(`FIND_IN_SET(${mysql.escape(value)}, categories)`);
      } else {
        if (type === currentFilter) {
          whereClauses.push(` OR ${type} = ${mysql.escape(value)}`);
        } else {
          if (currentFilter !== null) {
            whereClauses.push(")");
          }
          currentFilter = type;
          whereClauses.push(` AND ((${type} = ${mysql.escape(value)})`);
        }
      }
    }
  });

  if (categoryClauses.length > 0) {
    whereClauses.push(` AND (${categoryClauses.join(" OR ")})`);
  }

  if (currentFilter !== null) {
    whereClauses.push(")");
  }

  const whereClause = whereClauses.length > 0 ? whereClauses.join("") : "";

  const countQuery = `SELECT COUNT(*) as total FROM business WHERE 1=1 ${whereClause}`;
  con.query(countQuery, (err, countResult) => {
    if (err) {
      console.error("Error executing count query:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    const totalResults = countResult[0].total;

    const query = `SELECT * FROM business WHERE 1=1 ${whereClause} LIMIT ${pageSize} OFFSET ${offset}`;
    con.query(query, (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      res.json({ result, totalResults });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
