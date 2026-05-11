import { ClientService } from "./src/services/clientService.js";

async function test() {
  try {
    const clients = await ClientService.getAll();
    console.log("Found clients:", clients.length);
    if (clients.length > 0) {
      console.log("First client:", clients[0].name);
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
  process.exit(0);
}

test();
