import db from "./db.ts";
import { clsShow } from "./models/clsShow.ts";

console.log("Starting the Boris Theater Server...");

// --- TEMPORARY TEST BLOCK ---
console.log("Running Model Test...");
const testShow = new clsShow(
    "Hamlet - Opening Night",
    "2026-11-20",
    45.50,
    120,
);
testShow.AddShow(); // This triggers the validation and the INSERT query

const activeShows = clsShow.FindAllActive();
console.log("Currently Active Shows in DB:", activeShows);
// ----------------------------

// Start the local web server on port 8000
Deno.serve({ port: 8000 }, (_req) => {
    return new Response("Boris Theater System - MVC Engine is running!");
});
