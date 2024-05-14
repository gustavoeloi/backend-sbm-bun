import Elysia from "elysia";

const app = new Elysia().get("/", () => {
  console.log("Testing route")
});

app.listen(3333, () => {
  console.log("Http Server is Running...")
})

