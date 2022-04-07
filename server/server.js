import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Failed ${res.status}`);
  }
  return await res.json();
}

const discoveryEndpoint =
  "https://accounts.google.com/.well-known/openid-configuration";

app.get("/api/config", (req, res) => {
  res.json({
    response_type: "token",
    client_id:
      "646025809123-lief8ln7sasibgeabkfbbp5e6mhe7fjh.apps.googleusercontent.com",
    discovery_endpoint,
  });
});

app.get("/api/login", async (req, res) => {
  const { access_token } = req.signedCookies;

  const { userinfo_endpoint } = await fetchJSON(discoveryEndpoint);

  const userinfo = await fetch(userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  if (userinfo.ok) {
    res.json(await userinfo.json());
  } else {
    console.log(`Failed to fetch ${userinfo.status} ${userinfo.statusText}`);
    res.sendStatus(500);
  }
});

app.post("/api/login", (req, res) => {
  const { access_token } = req.body;
  res.cookie("access_token", access_token, { signed: true });
  res.sendStatus(200);
});

app.use(express.static("../client/dist"));

app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.resolve("../client/dist/index.html"));
  } else {
    next();
  }
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Started on http://localhost:${server.address().port}`);
});
