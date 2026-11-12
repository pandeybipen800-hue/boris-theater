import { ShowController } from "./controllers/showController.ts";

console.log("Starting the Boris Theater Server...");

Deno.serve({ port: 8000 }, async (req) => {
    const url = new URL(req.url);

    // Route requests to Controller methods
    if (url.pathname === "/" || url.pathname === "/browse") {
        return await ShowController.getBrowsePage();
    } else if (url.pathname === "/admin/add-show" && req.method === "GET") {
        return await ShowController.getAddShowPage();
    } else if (url.pathname === "/api/add-show" && req.method === "POST") {
        return await ShowController.handleAddShow(req);
    }

    return new Response("404 - Page Not Found", { status: 404 });
});
