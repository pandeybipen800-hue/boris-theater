import db from "../db.ts";

export class clsShow {
    // Public Attributes mapping to tblShow
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

    // Implementation of the <<include>> Validate Data Input use case
    public Validate(): boolean {
        if (this.ShowTitle.trim() === "") return false;
        if (this.TicketPrice <= 0) return false;
        if (this.AvailableSeats < 0) return false;
        // (Optional) Add future date validation here
        return true;
    }

    // Method to Add Show to Database
    public AddShow(): boolean {
        if (!this.Validate()) {
            console.error(
                `Validation failed for show: '${this.ShowTitle}'. Cannot add to database.`,
            );
            return false;
        }

        try {
            db.query(
                `INSERT INTO tblShow (ShowTitle, ShowDate, TicketPrice, AvailableSeats, IsActive) 
         VALUES (?, ?, ?, ?, ?)`,
                [
                    this.ShowTitle,
                    this.ShowDate,
                    this.TicketPrice,
                    this.AvailableSeats,
                    this.IsActive ? 1 : 0,
                ],
            );
            console.log(
                `Success: Show '${this.ShowTitle}' was safely added to the database.`,
            );
            return true;
        } catch (error) {
            console.error("Database error while adding show:", error);
            return false;
        }
    }

    // Static method to fetch all active shows for the public Browse Shows grid
    public static FindAllActive(): any[] {
        const shows = [...db.query("SELECT * FROM tblShow WHERE IsActive = 1")]
            .map((row) => {
                return {
                    ShowID: row[0],
                    ShowTitle: row[1],
                    ShowDate: row[2],
                    TicketPrice: row[3],
                    AvailableSeats: row[4],
                    IsActive: row[5] === 1,
                };
            });
        return shows;
    }
}
