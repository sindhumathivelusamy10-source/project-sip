document.addEventListener("DOMContentLoaded", () => {

    const authWrap = document.getElementById("authWrap");
    const appShell = document.getElementById("appShell");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".view");

    // LOGIN
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

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

    // REGISTER
    if(registerForm){
        registerForm.addEventListener("submit", function(e){
            e.preventDefault();

            alert("Registration Successful");

            authWrap.style.display = "none";
            appShell.style.display = "flex";

            loadDashboard("newuser@gmail.com");
        });
    }

    // LOGOUT
    const logoutBtn = document.getElementById("logoutBtn");

    if(logoutBtn){
        logoutBtn.addEventListener("click", () => {
            appShell.style.display = "none";
            authWrap.style.display = "flex";
        });
    }

    // SIDEBAR NAVIGATION
    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const view = item.dataset.view;

            if(!view) return;

            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            views.forEach(v => v.classList.remove("active"));

            const selected =
                document.getElementById(`view-${view}`);

            if(selected){
                selected.classList.add("active");
            }

            document.getElementById("viewTitle").textContent =
                item.textContent.trim();

        });

    });

    // DASHBOARD FUNCTION
    function loadDashboard(email){

        const name =
            email === "sindhumathi@gmail.com"
            ? "Sindhumathi Velusamy"
            : "Ravi Kumar";

        // Scoreboard
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

        // Membership
        document.getElementById("dashPlanBadge").textContent =
            "Elite Membership";

        document.getElementById("dashPlanInfo").innerHTML = `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Plan:</strong> Elite Membership</p>
            <p><strong>Status:</strong> Active</p>
            <p><strong>Valid Until:</strong> 31 Dec 2026</p>
        `;

        // Upcoming Classes
        document.getElementById("dashUpcoming").innerHTML = `
            <ul>
                <li>Yoga - Monday - 6:00 AM</li>
                <li>Cardio Blast - Wednesday - 7:00 AM</li>
                <li>Strength Training - Friday - 6:30 PM</li>
                <li>Zumba - Saturday - 8:00 AM</li>
            </ul>
        `;

        // Notifications
        document.getElementById("notifList").innerHTML = `
            <p>Membership renewed successfully.</p>
            <p>Yoga class booked for Monday.</p>
            <p>Congratulations! 12 classes completed.</p>
        `;

        // Schedule
        document.getElementById("scheduleList").innerHTML = `
            <div class="card">
                <h3>Yoga</h3>
                <p>Monday - 6:00 AM</p>
            </div>

            <div class="card">
                <h3>Cardio Blast</h3>
                <p>Wednesday - 7:00 AM</p>
            </div>

            <div class="card">
                <h3>Strength Training</h3>
                <p>Friday - 6:30 PM</p>
            </div>
        `;

        // Bookings
        document.getElementById("bookingsTable").innerHTML = `
            <tr>
                <td>Yoga</td>
                <td>21 Jul 2026</td>
                <td>6:00 AM</td>
                <td>Priya Sharma</td>
                <td>Confirmed</td>
                <td>-</td>
            </tr>

            <tr>
                <td>Cardio Blast</td>
                <td>23 Jul 2026</td>
                <td>7:00 AM</td>
                <td>Rahul Kumar</td>
                <td>Confirmed</td>
                <td>-</td>
            </tr>
        `;

        // Workout
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

        // Nutrition
        document.getElementById("nutritionList").innerHTML = `
            <div class="card">
                <h3>Nutrition Plan</h3>
                <p>Breakfast - Oats and Milk</p>
                <p>Lunch - Rice and Chicken</p>
                <p>Dinner - Salad and Protein Shake</p>
            </div>
        `;

        // Progress
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

        // Billing
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

        // Profile
        document.getElementById("profileInfo").innerHTML = `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> 9876543210</p>
            <p><strong>Membership:</strong> Elite Membership</p>
        `;
    }
});