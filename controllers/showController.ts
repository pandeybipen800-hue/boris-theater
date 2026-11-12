import { clsShow } from "../models/clsShow.ts";

export class ShowController {
    // Render the public show grid
    public static async getBrowsePage(): Promise<Response> {
        const htmlTemplate = await Deno.readTextFile("./views/browse.html");
        const activeShows = clsShow.FindAllActive();

        let cardsHtml = "";
        if (activeShows.length === 0) {
            cardsHtml = "<p>No upcoming shows scheduled.</p>";
        } else {
            cardsHtml = activeShows.map((show) => `
        <div class="show-card">
          <h2>${show.ShowTitle}</h2>
          <p><strong>Date:</strong> ${show.ShowDate}</p>
          <p><strong>Price:</strong> <span class="price">$${
                show.TicketPrice.toFixed(2)
            }</span></p>
          <p><strong>Available Seats:</strong> ${show.AvailableSeats}</p>
        </div>
      `).join("");
        }

        const finalHtml = htmlTemplate.replace("{{SHOW_CARDS}}", cardsHtml);
        return new Response(finalHtml, {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }

    // Render the admin form
    public static async getAddShowPage(): Promise<Response> {
        const html = await Deno.readTextFile("./views/add-show.html");
        return new Response(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }

    // Handle form submission to add a show
    public static async handleAddShow(req: Request): Promise<Response> {
        const formData = await req.formData();
        const title = formData.get("title")?.toString() || "";
        const date = formData.get("date")?.toString() || "";
        const price = parseFloat(formData.get("price")?.toString() || "0");
        const seats = parseInt(formData.get("seats")?.toString() || "0");

        const newShow = new clsShow(title, date, price, seats);
        const success = newShow.AddShow();

        if (success) {
            // Redirect back to the browse page after saving
            return Response.redirect("http://localhost:8000/browse", 303);
        } else {
            return new Response(
                "Validation failed. Please go back and check your input.",
                { status: 400 },
            );
        }
    }
}
