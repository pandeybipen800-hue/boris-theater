// SERVER ROUTER: server.ts
// Entry point for the Deno web server. Connects URL paths to ShowController methods.

import { ShowController } from "./controllers/showController.ts";

console.log("Starting Boris Theater Server on http://localhost:8000 ...");

Deno.serve({ port: 8000 }, async (req) => {
    const url = new URL(req.url);

    // Serve the shared CSS file from the publics folder
    if (url.pathname === "/style.css") {
        const css = await Deno.readTextFile("./publics/style.css");
        return new Response(css, {
            headers: { "content-type": "text/css; charset=utf-8" },
        });
    }

    // Main Menu & Authentication Routes
    if (url.pathname === "/") {
        return await ShowController.getMenuPage(req);
    } else if (url.pathname === "/login" && req.method === "GET") {
        return await ShowController.getLoginPage();
    } else if (url.pathname === "/api/login" && req.method === "POST") {
        return await ShowController.handleLogin(req);
    } else if (url.pathname === "/logout") {
        return ShowController.handleLogout();
    } // Show Management Routes (List, Find, Filter, Add, Edit, Deactivate)
    else if (url.pathname === "/browse") {
        return await ShowController.getBrowsePage(req);
    } else if (url.pathname === "/admin/add-show" && req.method === "GET") {
        return await ShowController.getAddShowPage(req);
    } else if (url.pathname === "/api/add-show" && req.method === "POST") {
        return await ShowController.handleAddShow(req);
    } else if (url.pathname === "/admin/edit-show" && req.method === "GET") {
        return await ShowController.getEditShowPage(req);
    } else if (url.pathname === "/api/edit-show" && req.method === "POST") {
        return await ShowController.handleEditShow(req);
    } else if (
        url.pathname === "/api/deactivate-show" && req.method === "POST"
    ) {
        return await ShowController.handleDeactivateShow(req);
    }

    return new Response("404 - Page Not Found", { status: 404 });
});
