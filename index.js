//import packages
const pg = require("pg");
const express = require("express");
const morgan = require("morgan");

//create client to connect to the database
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/workshop_block32"
);

//create the express server
const server = express();

//function to create our database table, seed data into the tables when first starting the server
async function init() {
  //wait for the client to connect to the database
  await client.connect();
  console.log("connected to database");

  //create SQL to wipe the database and create a new table based on our schema
  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        is_favorite INTEGER DEFAULT 3 NOT NULL, 
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
  `;

  //wait for the database to process the query
  await client.query(SQL);
  console.log("tables created");

  //create SQL statement to insert 3 new rows of data into our table
  SQL = `
    INSERT INTO flavors(txt, ranking) VALUES('Make RESTful API', 5);
    INSERT INTO flavors(ranking, txt) VALUES(4, 'Create a POST endpoint');
    INSERT INTO flavors(txt) VALUES('Create a GET endpoint');
  `;

  //wait for the database to process the query
  await client.query(SQL);
  console.log("data seeded");

  //have the server listen on a port
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server listening on port ${port}`));
}

//call the function so the server can start
init();

//middleware to use before all routes
server.use(express.json()); //parses the request body so our route can access it
server.use(require("morgan")("dev")); //logs the requests received to the server

//endpoints CRUD
//C - CREATE --> POST
//R - READ --> GET
//U - UPDATE --> PUT
//D - DELETE --> DELETE

//CREATE - adds a new note to the table
server.post("/api/flavors", async (req, res, next) => {
  try {
    //create the SQL query to create a new note based on the information in the request body
    const SQL = `INSERT INTO flavors(txt) VALUES($1) RETURNING *;`;
    //await the response from the client querying the database
    const response = await client.query(SQL, [req.body.txt]);
    //send the response
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//READ - returns an array of flavors objects
server.get("/api/flavors", async (req, res, next) => {
  try {
    //create the SQL query to select all the flavors in descending order based on when they were created
    const SQL = `SELECT * FROM flavors ORDER BY created_at DESC;`;
    //await the response from the client querying the database
    const response = await client.query(SQL);
    //send the response. If no status code is given express will send 200 by default
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//UPDATE - edits a flavor based on the id passed and information within the request body
server.put("/api/flavors/:id", async (req, res, next) => {
  try {
    //create the SQL query to update the flavor with the selected id
    const SQL = `UPDATE flavors SET txt=$1, ranking=$2, updated_at=now() WHERE id=$3 RETURNING *;`;
    //await the response from the client querying the database
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.ranking,
      req.params.id,
    ]);
    //send the response. If no status code is given express will send 200 by default
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//DELETE
server.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    //create the SQL query to delete a flavor by id
    const SQL = `DELETE FROM flavors WHERE id=$1;`;
    //await the response from the client querying the database
    await client.query(SQL, [req.params.id]);
    //send the response with a status code of 204 No Content
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});