// MIDDLE/PRESENTATION CONTROLLER: showController.ts
// Handles HTTP requests, checks staff login cookies, calls clsShow methods, and renders HTML views.

import { clsShow } from "../models/clsShow.ts";

export class ShowController {
    // Helper method to replace placeholders whether VS Code adds spaces ({{ TAG }}) or not ({{TAG}})
    private static fillTemplate(
        html: string,
        data: Record<string, string>,
    ): string {
        let output = html;
        for (const [key, value] of Object.entries(data)) {
            const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
            output = output.replace(pattern, () => value);
        }
        return output;
    }

    // Helper method to check if the staff cookie is active
    private static isLoggedIn(req: Request): boolean {
        const cookieHeader = req.headers.get("cookie") || "";
        return cookieHeader.includes("staff_auth=true");
    }

    // Helper method to format validation errors into an HTML alert box
    private static formatErrors(errors: string[]): string {
        if (errors.length === 0) return "";
        const listItems = errors.map((err) => `<li>${err}</li>`).join("");
        return `<div class="error-box"><strong>Please fix the following errors:</strong><ul>${listItems}</ul></div>`;
    }

    // Render the Main Menu page
    public static async getMenuPage(req: Request): Promise<Response> {
        const html = await Deno.readTextFile("./views/menu.html");
        const authLink = this.isLoggedIn(req)
            ? `<a href="/logout">Logout (Staff)</a>`
            : `<a href="/login">Staff Login</a>`;

        const finalHtml = this.fillTemplate(html, { AUTH_LINK: authLink });
        return new Response(finalHtml, {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }

    // Render the Staff Login page
    public static async getLoginPage(errorMsg: string = ""): Promise<Response> {
        const html = await Deno.readTextFile("./views/login.html");
        const errorHtml = errorMsg
            ? `<div class="error-box">${errorMsg}</div>`
            : "";
        const finalHtml = this.fillTemplate(html, { ERROR_MSG: errorHtml });

        return new Response(finalHtml, {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }

    // Process Staff Login credentials and set session cookie
    public static async handleLogin(req: Request): Promise<Response> {
        const formData = await req.formData();
        const username = formData.get("username")?.toString() || "";
        const password = formData.get("password")?.toString() || "";

        if (username === "admin" && password === "boris123") {
            return new Response(null, {
                status: 303,
                headers: {
                    "Location": "http://localhost:8000/browse",
                    "Set-Cookie": "staff_auth=true; Path=/; HttpOnly",
                },
            });
        }

        return await this.getLoginPage(
            "Invalid username or password. Try admin / boris123.",
        );
    }

    // Log out staff user by clearing the cookie
    public static handleLogout(): Response {
        return new Response(null, {
            status: 303,
            headers: {
                "Location": "http://localhost:8000/",
                "Set-Cookie": "staff_auth=; Path=/; Max-Age=0",
            },
        });
    }

    // Render the Browse, Find & Filter page
    public static async getBrowsePage(req: Request): Promise<Response> {
        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";
        const maxPriceParam = url.searchParams.get("maxPrice") || "";
        const maxPrice = maxPriceParam !== ""
            ? parseFloat(maxPriceParam)
            : 9999;

        // Fetch filtered shows from the Middle Layer
        const shows = clsShow.FilterShows(search, maxPrice);
        const loggedIn = this.isLoggedIn(req);

        let cardsHtml = "";
        if (shows.length === 0) {
            cardsHtml = "<p>No shows matched your search criteria.</p>";
        } else {
            cardsHtml = shows.map((show) => `
        <div class="show-card">
          <h2>${show.ShowTitle}</h2>
          <p><strong>Date:</strong> ${show.ShowDate}</p>
          <p><strong>Price:</strong> <span class="price">$${
                show.TicketPrice.toFixed(2)
            }</span></p>
          <p><strong>Available Seats:</strong> ${show.AvailableSeats}</p>
          
          ${
                loggedIn
                    ? `
            <div class="admin-controls">
              <a href="/admin/edit-show?id=${show.ShowID}" class="btn-edit">Edit Show</a>
              <form action="/api/deactivate-show" method="POST" style="display:inline;">
                <input type="hidden" name="id" value="${show.ShowID}">
                <button type="submit" class="btn-delete">Cancel / Deactivate</button>
              </form>
            </div>
          `
                    : `<p style="font-size: 13px; color: #64748b; margin-top: 10px;"><em>Log in as Staff to edit or cancel this show.</em></p>`
            }
        </div>
      `).join("");
        }

        const authLink = loggedIn
            ? `<a href="/logout">Logout (Staff)</a>`
            : `<a href="/login">Staff Login</a>`;

        const htmlTemplate = await Deno.readTextFile("./views/browse.html");
        const finalHtml = this.fillTemplate(htmlTemplate, {
            AUTH_LINK: authLink,
            SEARCH_VAL: search,
            PRICE_VAL: maxPriceParam,
            SHOW_CARDS: cardsHtml,
        });

        return new Response(finalHtml, {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }

    // Render Add Show form (requires Staff Login)
    public static async getAddShowPage(
        req: Request,
        errors: string[] = [],
    ): Promise<Response> {
        if (!this.isLoggedIn(req)) {
            return await this.getLoginPage(
                "Please log in as Staff before adding a new show.",
            );
        }

        const html = await Deno.readTextFile("./views/add-show.html");
        const finalHtml = this.fillTemplate(html, {
            ERROR_MSG: this.formatErrors(errors),
        });
        return new Response(finalHtml, {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }

    // Handle Add Show form submission and display validation errors if invalid
    public static async handleAddShow(req: Request): Promise<Response> {
        if (!this.isLoggedIn(req)) {
            return Response.redirect("http://localhost:8000/login", 303);
        }

        const formData = await req.formData();
        const newShow = new clsShow(
            formData.get("title")?.toString() || "",
            formData.get("date")?.toString() || "",
            parseFloat(formData.get("price")?.toString() || "0"),
            parseInt(formData.get("seats")?.toString() || "0"),
        );

        const result = newShow.AddShow();
        if (result.success) {
            return Response.redirect("http://localhost:8000/browse", 303);
        }

        return await this.getAddShowPage(req, result.errors);
    }

    // Render Edit Show form (requires Staff Login)
    public static async getEditShowPage(
        req: Request,
        errors: string[] = [],
    ): Promise<Response> {
        if (!this.isLoggedIn(req)) {
            return await this.getLoginPage(
                "Please log in as Staff before editing a show.",
            );
        }

        const url = new URL(req.url);
        const id = parseInt(url.searchParams.get("id") || "0");
        const show = clsShow.FindByID(id);

        if (!show) return new Response("Show not found", { status: 404 });

        const htmlTemplate = await Deno.readTextFile("./views/edit-show.html");
        const finalHtml = this.fillTemplate(htmlTemplate, {
            ERROR_MSG: this.formatErrors(errors),
            ID: show.ShowID.toString(),
            TITLE: show.ShowTitle,
            DATE: show.ShowDate,
            PRICE: show.TicketPrice.toString(),
            SEATS: show.AvailableSeats.toString(),
        });

        return new Response(finalHtml, {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }

    // Handle Edit Show form submission
    public static async handleEditShow(req: Request): Promise<Response> {
        if (!this.isLoggedIn(req)) {
            return Response.redirect("http://localhost:8000/login", 303);
        }

        const formData = await req.formData();
        const id = parseInt(formData.get("id")?.toString() || "0");
        const title = formData.get("title")?.toString() || "";
        const date = formData.get("date")?.toString() || "";
        const price = parseFloat(formData.get("price")?.toString() || "0");
        const seats = parseInt(formData.get("seats")?.toString() || "0");

        const result = clsShow.UpdateShow(id, title, date, price, seats);
        if (result.success) {
            return Response.redirect("http://localhost:8000/browse", 303);
        }

        // Re-render edit page with error messages if validation failed
        const htmlTemplate = await Deno.readTextFile("./views/edit-show.html");
        const finalHtml = this.fillTemplate(htmlTemplate, {
            ERROR_MSG: this.formatErrors(result.errors),
            ID: id.toString(),
            TITLE: title,
            DATE: date,
            PRICE: price.toString(),
            SEATS: seats.toString(),
        });

        return new Response(finalHtml, {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }

    // Handle Soft Delete (Deactivate)
    public static async handleDeactivateShow(req: Request): Promise<Response> {
        if (!this.isLoggedIn(req)) {
            return Response.redirect("http://localhost:8000/login", 303);
        }

        const formData = await req.formData();
        const id = parseInt(formData.get("id")?.toString() || "0");

        clsShow.DeactivateShow(id);
        return Response.redirect("http://localhost:8000/browse", 303);
    }
}
