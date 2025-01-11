import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import rateLimit from "axios-rate-limit";

const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const http = rateLimit(axios.create(), { maxRequests: 5, perMilliseconds: 60 * 1000 });

app.get("/", (req, res) => {
  res.render("index.ejs", { data: null, error: null });
});

function getType(req) {
  console.log("req.body.type:", req.body.type);
  if (req.body.type === "") {
    return null;
  } else {
    return req.body.type;
  }
};

function getParticipants(req) {
  console.log("req.body.participants:", req.body.participants);
  if (req.body.participants === "") {
    return null;
  } else {
    return req.body.participants;
  }
};

app.post("/", async (req, res) => {
  console.log(req.body);
  console.log("Enviando para a API...", { type: req.body.type, participants: req.body.participants });
  
  try {
    const type = getType(req);
    const participants = getParticipants(req);

    const params = {};

    if (type) params.type = type;
    if (participants) params.participants = participants;

    console.log("Params being sent to API:", params);

    let filterResult;

    // Verificar se há parâmetros antes de fazer a requisição
    if (Object.keys(params).length === 0) {
      console.log("No parameters provided, making request to /random endpoint.");
      const randomResponse = await http.get("https://bored-api.appbrewery.com/random");
      filterResult = randomResponse.data;
      res.render("index.ejs", { data: filterResult, error: null });
      return; // Parar a execução após a resposta
    } else {
      console.log("Making request to /filter endpoint with params:", params);
      const filterResponse = await http.get("https://bored-api.appbrewery.com/filter", {
        params: params
      });
      filterResult = filterResponse.data;

      // Selecionar um item aleatório do array retornado pelo filtro
      if (Array.isArray(filterResult) && filterResult.length > 0) {
        const randomIndex = Math.floor(Math.random() * filterResult.length);
        filterResult = filterResult[randomIndex];
      }

      res.render("index.ejs", { data: filterResult, error: null });
      return; // Parar a execução após a resposta
    }

  } catch (error) {
    console.error("Status code:", error.response.status);
    console.error("API Response:", error.response.data);
    console.error("Failed to make request:", error.message);

    if (error.response && error.response.status === 404) {
      res.render("index.ejs", {
        data: null,
        error: "No activities that match your criteria.", 
      });
    } else if (error.response && error.response.status === 429) {
      res.render("index.ejs", {
        data: null,
        error: "Too many requests, find that bug.",
      });
    } else {
      res.render("index.ejs", {
        data: null,
        error: error.message,
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
