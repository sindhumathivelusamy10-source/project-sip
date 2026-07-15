// ===============================
// FLEXZONE - DAY 1 FRONTEND DEMO
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const authWrap = document.getElementById("authWrap");
    const appShell = document.getElementById("appShell");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".view");

    // -------------------------------
    // LOGIN
    // -------------------------------
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();

        authWrap.style.display = "none";
        appShell.style.display = "flex";

        document.getElementById("viewTitle").textContent = "Dashboard";
        document.getElementById("viewSubtitle").textContent =
            "Welcome to FlexZone Gym Management System";
    });

    // -------------------------------
    // REGISTER
    // -------------------------------
    registerForm.addEventListener("submit", function(e) {
        e.preventDefault();

        alert("Registration Successful (Demo Mode)");

        authWrap.style.display = "none";
        appShell.style.display = "flex";
    });

    // -------------------------------
    // SIDEBAR NAVIGATION
    // -------------------------------
    navItems.forEach(item => {
        item.addEventListener("click", () => {

            if(item.id === "logoutBtn"){
                appShell.style.display = "none";
                authWrap.style.display = "flex";
                return;
            }

            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const view = item.dataset.view;

            views.forEach(v => v.classList.remove("active"));

            const selectedView =
                document.getElementById(`view-${view}`);

            if(selectedView){
                selectedView.classList.add("active");

                document.getElementById("viewTitle").textContent =
                    item.textContent.trim();

                document.getElementById("viewSubtitle").textContent =
                    "Frontend Demo Version";
            }
        });
    });

    // -------------------------------
    // DASHBOARD SAMPLE DATA
    // -------------------------------
    const scoreboard =
        document.getElementById("memberScoreboard");

    if(scoreboard){
        scoreboard.innerHTML = `
            <div class="stat-card">
                <h2>12</h2>
                <p>Classes Attended</p>
            </div>

            <div class="stat-card">
                <h2>8</h2>
                <p>Bookings</p>
            </div>

            <div class="stat-card">
                <h2>72kg</h2>
                <p>Current Weight</p>
            </div>

            <div class="stat-card">
                <h2>Elite Plan</h2>
                <p>Membership</p>
            </div>
        `;
    }

    // Membership details
    const planInfo =
        document.getElementById("dashPlanInfo");

    if(planInfo){
        planInfo.innerHTML = `
            <p><strong>Plan:</strong> Elite Membership</p>
            <p><strong>Status:</strong> Active</p>
            <p><strong>Valid Until:</strong> 31 Dec 2026</p>
        `;
    }

    // Upcoming classes
    const upcoming =
        document.getElementById("dashUpcoming");

    if(upcoming){
        upcoming.innerHTML = `
            <ul>
                <li>Yoga - Monday - 6:00 AM</li>
                <li>Cardio Blast - Wednesday - 7:00 AM</li>
                <li>Strength Training - Friday - 6:30 PM</li>
            </ul>
        `;
    }

});