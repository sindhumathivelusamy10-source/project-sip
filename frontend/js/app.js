document.addEventListener("DOMContentLoaded", () => {

    const authWrap = document.getElementById("authWrap");
    const appShell = document.getElementById("appShell");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".view");

    appShell.style.display = "none";
    authWrap.style.display = "flex";

    // ================= LOGIN =================

    loginForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        if (
            (email === "sindhumathi@gmail.com" && password === "123456") ||
            (email === "ravi@example.com" && password === "member123")
        ) {

            authWrap.style.display = "none";
            appShell.style.display = "flex";

            loadDashboard(email);

        } else {

            alert("Invalid Email or Password");

        }

    });

    // ================= REGISTER =================

    if (registerForm) {

        registerForm.addEventListener("submit", function (e) {

            e.preventDefault();

            alert("Registration Successful");

            authWrap.style.display = "none";
            appShell.style.display = "flex";

            loadDashboard("newuser@gmail.com");

        });

    }

    // ================= LOGOUT =================

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", () => {

            appShell.style.display = "none";
            authWrap.style.display = "flex";

        });

    }

    // ================= SIDEBAR =================

    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const view = item.dataset.view;

            if (!view) return;

            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            views.forEach(v => v.classList.remove("active"));

            document.getElementById("view-" + view).classList.add("active");

            document.getElementById("viewTitle").textContent =
                item.textContent.trim();

        });

    });

    // ================= DASHBOARD =================

    function loadDashboard(email) {

        const name =
            email === "sindhumathi@gmail.com"
                ? "Sindhumathi Velusamy"
                : "Ravi Kumar";

        document.getElementById("viewSubtitle").textContent =
            "Welcome back, " + name;

        document.getElementById("memberScoreboard").innerHTML = `
            <div class="stat">
                <span class="num">12</span>
                <span class="label">Classes Attended</span>
            </div>

            <div class="stat cyan">
                <span class="num">8</span>
                <span class="label">Bookings</span>
            </div>

            <div class="stat coral">
                <span class="num">72 KG</span>
                <span class="label">Current Weight</span>
            </div>

            <div class="stat">
                <span class="num">Elite Plan</span>
                <span class="label">Membership</span>
            </div>
        `;
                // ================= MEMBERSHIP =================

        document.getElementById("dashPlanBadge").textContent =
            "Elite Membership";

        document.getElementById("dashPlanInfo").innerHTML = `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Plan:</strong> Elite Membership</p>
            <p><strong>Status:</strong> Active</p>
            <p><strong>Valid Until:</strong> 31 Dec 2026</p>
        `;

        // ================= UPCOMING CLASSES =================

        document.getElementById("dashUpcoming").innerHTML = `
            <ul>
                <li>Yoga - Monday - 6:00 AM</li>
                <li>Cardio Blast - Wednesday - 7:00 AM</li>
                <li>Strength Training - Friday - 6:30 PM</li>
                <li>Zumba - Saturday - 8:00 AM</li>
            </ul>
        `;

        // ================= NOTIFICATIONS =================

        document.getElementById("notifList").innerHTML = `
            <p>Membership renewed successfully.</p>
            <p>Yoga class booked successfully.</p>
            <p>Congratulations! 12 classes completed.</p>
        `;

        // ================= CLASS SCHEDULE =================

        document.getElementById("scheduleList").innerHTML = `

        <div class="card">
            <h3>Yoga</h3>
            <p>📅 Monday</p>
            <p>🕒 6:00 AM</p>
            <p>👨‍🏫 Trainer: Priya Sharma</p>
            <button class="btn btn-primary"
                onclick="bookClass('Yoga')">
                Book Now
            </button>
        </div>

        <div class="card">
            <h3>Cardio Blast</h3>
            <p>📅 Wednesday</p>
            <p>🕒 7:00 AM</p>
            <p>👨‍🏫 Trainer: Rahul Kumar</p>
            <button class="btn btn-primary"
                onclick="bookClass('Cardio Blast')">
                Book Now
            </button>
        </div>

        <div class="card">
            <h3>Strength Training</h3>
            <p>📅 Friday</p>
            <p>🕒 6:30 PM</p>
            <p>👨‍🏫 Trainer: Arjun Singh</p>
            <button class="btn btn-primary"
                onclick="bookClass('Strength Training')">
                Book Now
            </button>
        </div>

        `;

        // ================= WORKOUT =================

        document.getElementById("workoutList").innerHTML = `

            <div class="card">
                <h3>Workout Plan</h3>
                <p>Monday - Chest & Triceps</p>
                <p>Tuesday - Back & Biceps</p>
                <p>Wednesday - Cardio</p>
                <p>Thursday - Legs</p>
                <p>Friday - Shoulders</p>
            </div>

        `;

        // ================= NUTRITION =================

        document.getElementById("nutritionList").innerHTML = `

            <div class="card">
                <h3>Nutrition Plan</h3>
                <p>Breakfast - Oats & Milk</p>
                <p>Lunch - Rice & Chicken</p>
                <p>Dinner - Salad & Protein Shake</p>
            </div>

        `;
                // ================= PROGRESS =================

        document.getElementById("progressTable").innerHTML = `
            <tr>
                <td>01 Jan 2026</td>
                <td>78 KG</td>
                <td>22%</td>
                <td>Started Journey</td>
            </tr>

            <tr>
                <td>01 Jul 2026</td>
                <td>72 KG</td>
                <td>18%</td>
                <td>Great Progress</td>
            </tr>
        `;

        // ================= BILLING =================

        document.getElementById("billingPlanInfo").innerHTML = `
            <p><strong>Plan:</strong> Elite Membership</p>
            <p><strong>Amount:</strong> ₹12,000</p>
            <p><strong>Status:</strong> Paid</p>
        `;

        document.getElementById("paymentsTable").innerHTML = `
            <tr>
                <td>01 Jan 2026</td>
                <td>Membership Fee</td>
                <td>₹12,000</td>
                <td>Paid</td>
            </tr>
        `;

        // ================= PROFILE =================

        document.getElementById("profileInfo").innerHTML = `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> 9876543210</p>
            <p><strong>Membership:</strong> Elite Membership</p>
        `;

    } // End of loadDashboard()

}); // End of DOMContentLoaded
// ================= BOOK CLASS =================

window.bookClass = function (className) {

    const bookingsTable = document.getElementById("bookingsTable");

    // Remove Loading row
    if (bookingsTable.innerHTML.includes("Loading")) {
        bookingsTable.innerHTML = "";
    }

    const bookedOn = new Date().toLocaleDateString("en-GB");

    let trainer = "";
    let time = "";
    let classDate = "";

    switch (className) {

        case "Yoga":
            trainer = "Priya Sharma";
            time = "6:00 AM";
            classDate = "21 Jul 2026";
            break;

        case "Cardio Blast":
            trainer = "Rahul Kumar";
            time = "7:00 AM";
            classDate = "23 Jul 2026";
            break;

        case "Strength Training":
            trainer = "Arjun Singh";
            time = "6:30 PM";
            classDate = "25 Jul 2026";
            break;

        default:
            trainer = "Trainer";
            time = "-";
            classDate = "-";
    }

    bookingsTable.insertAdjacentHTML("beforeend", `
        <tr>
            <td>${className}</td>
            <td>${bookedOn}</td>
            <td>${classDate}</td>
            <td>${time}</td>
            <td>${trainer}</td>
            <td>
                <span style="color:green;font-weight:bold;">
                    Confirmed
                </span>
            </td>
            <td>
                <button
                    class="btn btn-danger btn-sm"
                    onclick="cancelBooking(this)">
                    Cancel
                </button>
            </td>
        </tr>
    `);

    alert(className + " booked successfully!");

};


// ================= CANCEL BOOKING =================

window.cancelBooking = function (button) {

    if (confirm("Are you sure you want to cancel this booking?")) {

        button.closest("tr").remove();

        const bookingsTable = document.getElementById("bookingsTable");

        if (bookingsTable.rows.length === 0) {

            bookingsTable.innerHTML = `
                <tr>
                    <td colspan="7" class="muted">
                        No bookings available.
                    </td>
                </tr>
            `;
        }

        alert("Booking Cancelled Successfully");
    }

};