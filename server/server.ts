import express from "express";
import bodyParser from "body-parser";
import path from "path";
import pg from "pg";
import { moviesRoute } from "./routes/movies";

const app = express();
app.use(bodyParser.json());

const client = new pg.Client({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "rootpass2",
  database: "movies_db"
});

client.connect().catch((error) => {
  console.log(error)
})

app.use((_, res, next) => {
  res.locals.client = client
  next()
})

app.get("/client/*", (req, res) => {
  return res.sendFile(path.join(__dirname, "..", req.path));
});

app.use("/movies", moviesRoute)

app.listen(3000, () => {
  console.log("listening on port 3000");
});
