let CURRENT_USER = null;

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const authWrap = document.getElementById("authWrap");
    const appShell = document.getElementById("appShell");
    const logoutBtn = document.getElementById("logoutBtn");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        CURRENT_USER = {
            name: "Admin",
            role: "admin"
        };

        authWrap.style.display = "none";
        appShell.style.display = "flex";

        alert("Login Successful");
    });

    if(logoutBtn){
        logoutBtn.addEventListener("click", () => {
            appShell.style.display = "none";
            authWrap.style.display = "flex";
        });
    }

    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {

            const view = item.dataset.view;

            if(!view) return;

            document.querySelectorAll(".view")
                .forEach(v => v.classList.remove("active"));

            const selected =
                document.getElementById(`view-${view}`);

            if(selected){
                selected.classList.add("active");
            }

            document.querySelectorAll(".nav-item")
                .forEach(n => n.classList.remove("active"));

            item.classList.add("active");

            document.getElementById("viewTitle").textContent =
                item.innerText.trim();
        });
    });

});