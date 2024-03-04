import express from "express";
import z from "zod";
import pg from "pg";

const moviesRoute = express.Router();

moviesRoute.get("/get", async (req, res) => {
  const client: pg.Client = res.locals.client
  const movies = await client.query("SELECT * FROM movies")
  const tags = await client.query("SELECT * FROM tags")
  const movies_tags = await client.query("SELECT * FROM movies_tags")

  const data = movies.rows.map((movie) => ({ 
    tags: movies_tags.rows.filter(
      (movies_tag) => movies_tag.movie_id === movie.id
    ).map((movies_tag) => 
      tags.rows.find(
        (tag) => tag.id === movies_tag.tag_id
      ).name
    ),
    name: movie.name,
    price: movie.price,
    description: movie.description
  }))

  res.status(200).json(data)  
});

const DeleteSchema = z.object({
  movieName: z.string(),
})
  
moviesRoute.post("/delete", async (req, res) => {
  const deleteMovie = DeleteSchema.safeParse(req.body)
  
  if (!deleteMovie.success) {
    return res.status(400).json("invalid format")
  } 

  const client: pg.Client = res.locals.client

  await client.query("DELETE FROM movies WHERE name = $1;", [deleteMovie.data.movieName])

  return res.status(200).json("deleted movie")
});

const MovieSchema = z.object({
  name: z.string(),
  description: z.string(),
  tags: z.string().array(),
  price: z.number(),
});

type Movie = z.infer<typeof MovieSchema>;

function strArrayFormat(str: string, substr: string, sep: string, values: string[]): string {
  const idx = str.indexOf("$");
  if (idx == -1) return str;

  const subIdx = substr.indexOf("$");
  if (subIdx == -1) return str;

  const subStart = substr.substring(0, subIdx);
  const subEnd = substr.substring(subIdx + 1);

  let result = str.substring(0, idx);

  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    result += subStart + value + subEnd + sep;
  }

  result = result.substring(0, result.length - sep.length) + str.substring(idx + 1);

  return result;
}

moviesRoute.post("/add", async (req, res) => {
  const movie = z
    .object({
      name: z.string(),
      description: z.string(),
      tags: z.string(),
      price: z.string(),
    })
    .safeParse(req.body);

  if (!movie.success) {
    console.log(movie.error);
    return res.status(400).json("invalid format");
  }

  const price = parseFloat(movie.data.price);

  if (Number.isNaN(price)) {
    return res.status(400).json("price is not a number");
  }

  const formattedMovie: Movie = {
    name: movie.data.name,
    description: movie.data.description,
    tags: movie.data.tags.split(",").map((tag) => tag.trim()),
    price: price,
  };

  const client: pg.Client = res.locals.client;

  const insertTagsIfNew = strArrayFormat(
    "INSERT INTO tags (name) VALUES $ ON CONFLICT (name) DO NOTHING;",
    "('$')", ", ",
    formattedMovie.tags
  )

  await client.query(insertTagsIfNew)

  const getTags = strArrayFormat(
    "SELECT id FROM tags WHERE name IN ($);", 
    "'$'", ", ",
    formattedMovie.tags
  )

  const tags = await client.query(getTags)

  const movieID = (await client.query(
    `INSERT INTO movies (name, price, description) VALUES ($1, $2, $3) RETURNING id;`,
    [formattedMovie.name, formattedMovie.price, formattedMovie.description]
  )).rows[0].id;

  const insertMoviesTags = strArrayFormat(
    "INSERT INTO movies_tags (tag_id, movie_id) VALUES $",
    `('$', '${movieID}')`, ", ",
    tags.rows.map((row) => row.id)
  )

  await client.query(
    insertMoviesTags  
  );

  res.status(200).json("implement adding");
});

export { moviesRoute };
