// ===============================
// Gym Schedule JavaScript
// ===============================

// Store booked classes
let bookedClasses = [];

// -------------------------------
// Book Class
// -------------------------------
function bookClass(day, className, time, trainer, seatId) {

    // Prevent duplicate booking
    const alreadyBooked = bookedClasses.find(
        booking =>
            booking.day === day &&
            booking.className === className &&
            booking.time === time
    );

    if (alreadyBooked) {
        alert("You have already booked this class.");
        return;
    }

    // Seat availability
    const seat = document.getElementById(seatId);

    let availableSeats = parseInt(seat.innerText.split("/")[0]);

    if (availableSeats <= 0) {
        alert("Sorry! This class is full.");
        return;
    }

    // Update seats
    availableSeats--;

    seat.innerText = availableSeats + "/20";

    // Booking date
    const bookedOn = new Date().toLocaleDateString("en-GB");

    // Save booking
    bookedClasses.push({
        day,
        className,
        time,
        trainer,
        seatId
    });

    // Table
    const table = document.getElementById("bookingsTable");

    if (table.innerHTML.includes("No bookings")) {
        table.innerHTML = "";
    }

    table.insertAdjacentHTML("beforeend", `
        <tr>

            <td>${className}</td>

            <td>${bookedOn}</td>

            <td>${day}</td>

            <td>${time}</td>

            <td>${trainer}</td>

            <td style="color:green;font-weight:bold;">
                Confirmed
            </td>

            <td>

                <button
                    class="cancel-btn"
                    onclick="cancelBooking(
                    this,
                    '${day}',
                    '${className}',
                    '${time}',
                    '${seatId}'
                    )">

                    Cancel

                </button>

            </td>

        </tr>
    `);

    alert(className + " booked successfully!");
}

// -------------------------------
// Cancel Booking
// -------------------------------
function cancelBooking(button, day, className, time, seatId) {

    if (!confirm("Cancel this booking?")) {
        return;
    }

    // Remove row
    button.closest("tr").remove();

    // Restore seat
    const seat = document.getElementById(seatId);

    let availableSeats = parseInt(seat.innerText.split("/")[0]);

    availableSeats++;

    if (availableSeats > 20) {
        availableSeats = 20;
    }

    seat.innerText = availableSeats + "/20";

    // Remove from array
    bookedClasses = bookedClasses.filter(
        booking =>
            !(
                booking.day === day &&
                booking.className === className &&
                booking.time === time
            )
    );

    // Empty table
    const table = document.getElementById("bookingsTable");

    if (table.rows.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No bookings available.
                </td>
            </tr>
        `;

    }

    alert("Booking Cancelled");
}

// -------------------------------
// Search Class
// -------------------------------
function searchClass() {

    const value = document
        .getElementById("searchBox")
        .value
        .toLowerCase();

    const cards = document.querySelectorAll(".class-card");

    cards.forEach(card => {

        const title = card
            .querySelector("h3")
            .innerText
            .toLowerCase();

        if (title.includes(value)) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

}

// -------------------------------
// Trainer Filter
// -------------------------------
function filterTrainer() {

    const trainer = document
        .getElementById("trainerFilter")
        .value
        .toLowerCase();

    const cards = document.querySelectorAll(".class-card");

    cards.forEach(card => {

        const trainerName = card
            .querySelectorAll("p")[1]
            .innerText
            .toLowerCase();

        if (
            trainer === "" ||
            trainerName.includes(trainer)
        ) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

}