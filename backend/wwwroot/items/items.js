import {
  TENANT_ID,
  TinyHindClient
} from "../js/chunk-ZSY4DTTC.js";

// pages/items/items.ts
var appRoot = document.getElementById("app-root");
var tiny = new TinyHindClient("", TENANT_ID);
async function initialize() {
  appRoot.innerHTML = '<h2>Registering "Items" table...</h2>';
  try {
    const newItem = {
      Name: "bruh"
    };
  } catch (error) {
    appRoot.innerHTML = `<h2>Error registering table</h2><pre>${error.message}</pre>`;
    console.error(error);
  }
}
initialize();
