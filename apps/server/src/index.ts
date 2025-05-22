import { LocalFastifyServer } from "./config/development";
import { ProductionFastifyServer } from "./config/production";

export const server =
  process.env.NODE_ENV === "production"
    ? new ProductionFastifyServer()
    : new LocalFastifyServer();

server.start().then(() => {
  console.log("Server started successfully");
});
