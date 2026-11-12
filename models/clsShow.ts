// MIDDLE LAYER: clsShow.ts
// This class handles all the logic, validation, and database queries for my Show component.

import db from "../db.ts";

export class clsShow {
    public ShowID?: number;
    public ShowTitle: string;
    public ShowDate: string;
    public TicketPrice: number;
    public AvailableSeats: number;
    public IsActive: boolean;

    constructor(
        title: string,
        date: string,
        price: number,
        seats: number,
        isActive: boolean = true,
    ) {
        this.ShowTitle = title;
        this.ShowDate = date;
        this.TicketPrice = price;
        this.AvailableSeats = seats;
        this.IsActive = isActive;
    }

    // VALIDATION: Checks inputs before touching the database.
    // Returns an array of error messages to show the user.
    public Validate(): string[] {
        const errors: string[] = [];

        if (this.ShowTitle.trim() === "") {
            errors.push("Please enter a show title.");
        }
        if (this.ShowDate.trim() === "") {
            errors.push("Please select a valid date.");
        }
        if (this.TicketPrice <= 0) {
            errors.push("Ticket price must be more than 0.");
        }
        if (this.AvailableSeats < 0) {
            errors.push("Available seats cannot be a negative number.");
        }

        return errors;
    }

    // CREATE: Adds a new show to the database
    public AddShow(): { success: boolean; errors: string[] } {
        const errors = this.Validate();
        if (errors.length > 0) return { success: false, errors }; // Stop if validation fails

        try {
            db.query(
                "INSERT INTO tblShow (ShowTitle, ShowDate, TicketPrice, AvailableSeats, IsActive) VALUES (?, ?, ?, ?, ?)",
                [
                    this.ShowTitle,
                    this.ShowDate,
                    this.TicketPrice,
                    this.AvailableSeats,
                    this.IsActive ? 1 : 0,
                ],
            );
            return { success: true, errors: [] };
        } catch (error) {
            return {
                success: false,
                errors: ["Database error while saving the show."],
            };
        }
    }

    // READ (FIND AND FILTER): Gets shows based on search criteria
    public static FilterShows(
        searchQuery: string = "",
        maxPrice: number = 9999,
    ): any[] {
        // Basic query to get all active shows
        let sql = "SELECT * FROM tblShow WHERE IsActive = 1";
        const params: any[] = [];

        // If the user typed something in the search bar, filter by title
        if (searchQuery.trim() !== "") {
            sql += " AND ShowTitle LIKE ?";
            params.push(`%${searchQuery.trim()}%`);
        }

        // Filter by price
        sql += " AND TicketPrice <= ?";
        params.push(maxPrice);

        sql += " ORDER BY ShowDate ASC";

        // Convert raw database rows into nice objects
        return [...db.query(sql, params)].map((row) => ({
            ShowID: row[0],
            ShowTitle: row[1],
            ShowDate: row[2],
            TicketPrice: row[3],
            AvailableSeats: row[4],
            IsActive: row[5] === 1,
        }));
    }

    // READ (FIND BY ID): Gets a single show for the Edit page
    public static FindByID(id: number): any {
        const row = db.query("SELECT * FROM tblShow WHERE ShowID = ?", [id])[0];
        if (!row) return null;

        return {
            ShowID: row[0],
            ShowTitle: row[1],
            ShowDate: row[2],
            TicketPrice: row[3],
            AvailableSeats: row[4],
            IsActive: row[5] === 1,
        };
    }

    // UPDATE: Saves changes to an existing show
    public static UpdateShow(
        id: number,
        title: string,
        date: string,
        price: number,
        seats: number,
    ): { success: boolean; errors: string[] } {
        const tempShow = new clsShow(title, date, price, seats);
        const errors = tempShow.Validate();
        if (errors.length > 0) return { success: false, errors };

        try {
            db.query(
                "UPDATE tblShow SET ShowTitle=?, ShowDate=?, TicketPrice=?, AvailableSeats=? WHERE ShowID=?",
                [title, date, price, seats, id],
            );
            return { success: true, errors: [] };
        } catch (error) {
            return {
                success: false,
                errors: ["Database error while updating."],
            };
        }
    }

    // DELETE: Soft delete (Deactivate) so we don't break the order history
    public static DeactivateShow(id: number): void {
        db.query("UPDATE tblShow SET IsActive=0 WHERE ShowID=?", [id]);
    }
}
