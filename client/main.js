const getButton = document.getElementById("get-movies");
const movieForm = document.getElementById("movie-data");
const movies = document.getElementById("movies")

const deleteText = document.getElementById("delete-text");
const deleteButton = document.getElementById("delete")

getButton.addEventListener("click", async () => {
  const response = await fetch("http://localhost:3000/movies/get");

  movies.textContent = JSON.stringify(await response.json())
});

deleteButton.addEventListener("click", async () => {
  const response = await fetch("http://localhost:3000/movies/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      movieName: deleteText.value
    }) 
  })
  
  console.log(await response.json())
})

movieForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(movieForm, e.submitter);

  const output = {}

  for (const [key, value] of formData) {
    output[key] = value
  }

  (async () => {
    console.log(await (await fetch("http://localhost:3000/movies/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(output)
    })).json())
  })() 
});
