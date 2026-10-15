// ==========================================
// CAMPUSLOST
// FRONTEND VERSION - NO BACKEND
// ==========================================

// BASIC ELEMENTS

const loginPage =
    document.getElementById("loginPage");

const dashboardPage =
    document.getElementById("dashboardPage");


// ==========================================
// COLLEGE EMAIL VALIDATION
// ==========================================

function isValidEmail(email) {
    const pattern = /^(23|24|25|26)b01a(12|05|01|45|46|03|02|04)(0[1-9]|[1-9][0-9]|[a-j][0-9])@svecw\.edu\.in$/i;
    return pattern.test(String(email || "").trim());
}


// ==========================================
// STORAGE HELPERS
// ==========================================

function getAccounts() {

    return JSON.parse(
        localStorage.getItem("campusLostAccounts")
    ) || {};

}


function saveAccounts(accounts) {

    localStorage.setItem(
        "campusLostAccounts",
        JSON.stringify(accounts)
    );

}


function getRequests() {

    return JSON.parse(
        localStorage.getItem("campusLostRequests")
    ) || [];

}


function saveRequests(requests) {

    localStorage.setItem(
        "campusLostRequests",
        JSON.stringify(requests)
    );

}


function getNotifications() {

    return JSON.parse(
        localStorage.getItem("campusLostNotifications")
    ) || [];

}


function saveNotifications(notifications) {

    localStorage.setItem(
        "campusLostNotifications",
        JSON.stringify(notifications)
    );

}


function getCurrentUser() {

    return localStorage.getItem(
        "campusLostCurrentUser"
    );

}


// Poll server-backed notifications so updates from other students appear without a reload.
setInterval(() => {
    if (getCurrentUser()) updateNotificationBadge();
}, 12000);

// ==========================================
// DATE / TIME
// ==========================================

function formatDateTime(dateString) {

    const date =
        new Date(dateString);

    return date.toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// ==========================================
// LOGIN - BACKEND
// ==========================================

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const emailInput =
                document.getElementById("email");

            const passwordInput =
                document.getElementById("password");

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;

            const emailError =
                document.getElementById("emailError");

            const passwordError =
                document.getElementById("passwordError");

            emailError.textContent = "";
            passwordError.textContent = "";

            emailInput.classList.remove(
                "input-error"
            );

            passwordInput.classList.remove(
                "input-error"
            );

            if (!isValidEmail(email)) {

                emailError.textContent =
                    "❌ Please enter a valid SVECW college email ID.";

                emailInput.classList.add(
                    "input-error"
                );

                return;
            }

            if (password.length < 6) {

                passwordError.textContent =
                    "❌ Password must contain at least 6 characters.";

                passwordInput.classList.add(
                    "input-error"
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        "http://localhost:3000/api/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                email:
                                    email,

                                password:
                                    password

                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    passwordError.textContent =
                        "❌ " +
                        data.message;

                    passwordInput.classList.add(
                        "input-error"
                    );

                    return;
                }

                // Store logged-in user

                localStorage.setItem(
                    "campusLostCurrentUser",
                    data.user.email
                );

                // Store user information

                localStorage.setItem(
                    "campusLostCurrentUserData",
                    JSON.stringify(data.user)
                );

                const rememberMe =
                    document.getElementById(
                        "rememberMe"
                    ).checked;

                if (rememberMe) {

                    localStorage.setItem(
                        "campusLostRememberedUser",
                        email
                    );

                } else {

                    localStorage.removeItem(
                        "campusLostRememberedUser"
                    );

                }

                showDashboard();

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                alert(
                    "❌ Unable to connect to CampusLost server."
                );

            }

        }
    );

// ==========================================
// SHOW DASHBOARD
// ==========================================

function showDashboard() {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return;
    }

    const accounts =
        getAccounts();

    const account =
        accounts[currentUser];

    document.getElementById(
        "studentName"
    ).textContent =
        account?.name ||
        currentUser.split("@")[0];

    loginPage.classList.add(
        "hidden"
    );

    dashboardPage.classList.remove(
        "hidden"
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
    updateNotificationBadge();

}


// ==========================================
// CREATE ACCOUNT
// ==========================================

function createAccount() {

    const email =
        prompt(
            "Enter your SVECW college email ID:"
        );

    if (!email) {
        return;
    }

    const cleanEmail =
        email
            .trim()
            .toLowerCase();

    if (
        !isValidEmail(cleanEmail)
    ) {

        alert(
            "❌ Invalid college email.\n\n" +
            "Use your SVECW college ID."
        );

        return;
    }

    const name =
        prompt(
            "Enter your full name:"
        );

    if (!name || name.trim() === "") {

        alert(
            "Please enter your name."
        );

        return;
    }

    const studentId =
        prompt(
            "Enter your college ID:"
        );

    if (
        !studentId ||
        studentId.trim() === ""
    ) {

        alert(
            "Please enter your college ID."
        );

        return;
    }

    const password =
        prompt(
            "Create your CampusLost password:\n\n" +
            "This password is separate from your college email password."
        );

    if (!password) {
        return;
    }

    if (password.length < 6) {

        alert(
            "❌ Password must contain at least 6 characters."
        );

        return;
    }

    const accounts =
        getAccounts();

    if (accounts[cleanEmail]) {

        alert(
            "⚠️ This CampusLost account already exists."
        );

        return;
    }

    accounts[cleanEmail] = {

        name:
            name.trim(),

        studentId:
            studentId.trim(),

        password:
            password,

        createdAt:
            new Date().toISOString()

    };

    saveAccounts(accounts);

    alert(
        "✅ CampusLost account created successfully!"
    );

    document.getElementById(
        "email"
    ).value = cleanEmail;

    document.getElementById(
        "password"
    ).focus();

}


// ==========================================
// FORGOT PASSWORD
// ==========================================

function forgotPassword() {

    const email =
        prompt(
            "Enter your registered SVECW college email:"
        );

    if (!email) {
        return;
    }

    const cleanEmail =
        email
            .trim()
            .toLowerCase();

    if (
        !isValidEmail(cleanEmail)
    ) {

        alert(
            "❌ Please enter a valid SVECW college email."
        );

        return;
    }

    const accounts =
        getAccounts();

    if (!accounts[cleanEmail]) {

        alert(
            "❌ No CampusLost account was found for this email."
        );

        return;
    }

    const newPassword =
        prompt(
            "Enter your new CampusLost password:"
        );

    if (!newPassword) {
        return;
    }

    if (newPassword.length < 6) {

        alert(
            "❌ Password must contain at least 6 characters."
        );

        return;
    }

    accounts[cleanEmail].password =
        newPassword;

    saveAccounts(accounts);

    alert(
        "✅ Password reset successfully!"
    );

}


// ==========================================
// REMEMBER LOGIN
// ==========================================

window.addEventListener(
    "load",
    function() {

        const rememberedUser =
            localStorage.getItem(
                "campusLostRememberedUser"
            );

        if (rememberedUser) {

            document.getElementById(
                "email"
            ).value =
                rememberedUser;

            document.getElementById(
                "rememberMe"
            ).checked =
                true;

        }

    }
);


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    localStorage.removeItem(
        "campusLostCurrentUser"
    );

    dashboardPage.classList.add(
        "hidden"
    );

    loginPage.classList.remove(
        "hidden"
    );

    document.getElementById(
        "password"
    ).value = "";

    hideAllSections();

}


// ==========================================
// NAVIGATION — every dashboard shortcut opens its destination visibly
// ==========================================
function navigateToSection(sectionId, renderFn) {
    hideAllSections();
    const section = document.getElementById(sectionId);
    if (!section) {
        console.error(`CampusLost section not found: ${sectionId}`);
        alert("This section could not be opened. Please refresh the page and try again.");
        return;
    }
    section.classList.remove("hidden");
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof renderFn === "function") {
        Promise.resolve(renderFn()).catch(error => console.error(`Could not load ${sectionId}:`, error));
    }
}

function showRequestForm() {
    navigateToSection("requestForm");
    const section = document.getElementById("requestForm");
    const firstField = section?.querySelector("input:not([type=submit]):not([type=file]), textarea, select");
    if (firstField) firstField.focus({ preventScroll: true });
}
function showRequests() { navigateToSection("requestsSection", renderNearbyRequests); }
function showMyRequests() { navigateToSection("myRequestsSection", renderMyRequests); }
function showAcceptedTasks() { navigateToSection("acceptedTasksSection", renderAcceptedTasks); }
function showHistory() { navigateToSection("historySection", renderHistory); }
function showNotifications() { navigateToSection("notificationsSection", renderNotifications); }
function showFeedback() { navigateToSection("feedbackSection"); }

function hideAllSections() {
    ["requestForm", "requestsSection", "myRequestsSection", "acceptedTasksSection", "historySection", "notificationsSection", "feedbackSection"]
        .forEach(sectionId => document.getElementById(sectionId)?.classList.add("hidden"));
}

// ==========================================
// READ IMAGE
// ==========================================

function readImage(file) {

    return new Promise(
        function(resolve) {

            if (!file) {

                resolve("");

                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                function(event) {

                    resolve(
                        event.target.result
                    );

                };

            reader.readAsDataURL(file);

        }
    );

}


/// ==========================================
// CREATE LOST REQUEST - BACKEND
// ==========================================

document
    .getElementById("lostForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const currentUser = getCurrentUser();

            if (!currentUser) {

                alert("Please login first.");
                return;

            }

            const imageFile =
                document.getElementById("image").files[0];

            // Store the photo in MongoDB as a data URL so every student can see it.
            let image = "";
            if (imageFile) {
                if (!imageFile.type.startsWith("image/")) {
                    alert("Please select an image file.");
                    return;
                }
                if (imageFile.size > 2 * 1024 * 1024) {
                    alert("Please choose an image smaller than 2 MB.");
                    return;
                }
                image = await readImage(imageFile);
            }

            const requestData = {
                image,

                studentName:
                    document.getElementById("name").value.trim(),

                studentId:
                    document.getElementById("studentId").value.trim(),

                studentEmail:
                    currentUser,

                phone:
                    document.getElementById("phone").value.trim(),

                item:
                    document.getElementById("item").value.trim(),

                description:
                    document.getElementById("description").value.trim(),

                location:
                    document.getElementById("location").value.trim()

            };

            try {

                const response =
                    await fetch(
                        "http://localhost:3000/api/requests",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(requestData)
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        "❌ " +
                        (data.message ||
                        "Unable to create request.")
                    );

                    return;

                }

                alert(
                    "✅ " +
                    data.message
                );

                // Clear form

                document
                    .getElementById("lostForm")
                    .reset();

                // Refresh shared notifications and show the new request.
                updateNotificationBadge();
                showMyRequests();

            } catch (error) {

                console.error(
                    "Create request error:",
                    error
                );

                alert(
                    "❌ Unable to connect to CampusLost server."
                );

            }

        }
    );
 // ==========================================
// CREATE BACKEND REQUEST CARD
// ==========================================

function createBackendRequestCard(request) {

    return `
        <div class="request-card">

            ${request.image ? `<img src="${request.image}" class="request-image" alt="Photo of ${escapeHTML(request.item)}" loading="lazy">` : `<div class="item-image">🎒</div>`}

            <div class="request-info">

                <h3>
                    ${escapeHTML(request.item)}
                </h3>

                <p>
                    📍 ${escapeHTML(request.location)}
                </p>

                <p>
                    👤 ${escapeHTML(request.studentName)}
                </p>

                <p>
                    🕐 Posted:
                    ${formatDateTime(request.createdAt)}
                </p>

                <p class="description-text">
                    ${escapeHTML(request.description)}
                </p>

                <span class="status open">
                    🔴 Open
                </span>

            </div>

            <button
                class="help-btn"
                onclick="acceptBackendRequest('${request._id}')"
            >
                I Can Help
            </button>

        </div>
    `;

}


// ==========================================
// ACCEPT BACKEND REQUEST
// ==========================================

async function acceptBackendRequest(requestId) {

    const currentUser =
        getCurrentUser();

    const userData =
        JSON.parse(
            localStorage.getItem(
                "campusLostCurrentUserData"
            )
        );

    if (!currentUser) {

        alert("Please login first.");
        return;

    }

    if (!userData) {

        alert(
            "User information not found. Please login again."
        );

        return;

    }

    const confirmation =
        confirm(
            "Do you want to help with this lost-item request?"
        );

    if (!confirmation) {
        return;
    }

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/requests/${requestId}/accept`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        helperName:
                            userData.name,

                        helperStudentId:
                            userData.studentId,

                        helperEmail:
                            currentUser

                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                "❌ " +
                data.message
            );

            return;

        }

        alert(
            "🤝 " +
            data.message
        );

        // Refresh all affected lists from the database, not localStorage.
        await renderNearbyRequests();
        if (typeof renderMyRequests === "function") await renderMyRequests();
        if (typeof renderAcceptedTasks === "function") await renderAcceptedTasks();

    } catch (error) {

        console.error(
            "Accept request error:",
            error
        );

        alert(
            "❌ Unable to connect to CampusLost server."
        );

    }

}

// ==========================================
// RENDER NEARBY REQUESTS
// ==========================================

async function renderNearbyRequests() {

    const container =
        document.getElementById(
            "nearbyRequestsContainer"
        );

    const currentUser =
        getCurrentUser();

    try {

        const response =
            await fetch(
                "http://localhost:3000/api/requests"
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load requests."
            );

        }

        const openRequests =
            data.requests.filter(
                function(request) {

                    return (
                        String(request.status || "").toLowerCase() === "open" &&
                        String(request.studentEmail || "").toLowerCase() !== String(currentUser || "").toLowerCase()
                    );

                }
            );

        if (openRequests.length === 0) {

            container.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        🔎
                    </div>

                    <h3>
                        No nearby requests
                    </h3>

                    <p>
                        There are currently no open requests from other students.
                    </p>

                </div>

            `;

            return;
        }

        container.innerHTML =
            openRequests
                .map(
                    function(request) {

                        return createBackendRequestCard(
                            request
                        );

                    }
                )
                .join("");

    } catch (error) {

        console.error(
            "Load requests error:",
            error
        );

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load requests
                </h3>

                <p>
                    Please make sure the CampusLost server is running.
                </p>

            </div>

        `;

    }

}


// ==========================================
// CREATE REQUEST CARD
// ==========================================

function createRequestCard(request) {

    const imageHTML =
        request.image
            ? `
                <img
                    src="${request.image}"
                    class="request-image"
                    alt="Lost item"
                >
            `
            : `
                <div class="item-image">
                    🎒
                </div>
            `;

    return `

        <div class="request-card">

            ${imageHTML}

            <div class="request-info">

                <h3>
                    ${escapeHTML(request.item)}
                </h3>

                <p>
                    📍 ${escapeHTML(request.location)}
                </p>

                <p>
                    👤 ${escapeHTML(request.name)}
                </p>

                <p>
                    🕐 Posted:
                    ${formatDateTime(request.postedAt)}
                </p>

                <p class="description-text">
                    ${escapeHTML(request.description)}
                </p>

                <span class="status open">
                    🔴 Open
                </span>

            </div>

            <button
                class="help-btn"
                onclick="acceptRequest('${request.id}')"
            >
                I Can Help
            </button>

        </div>

    `;

}


// ==========================================
// ACCEPT REQUEST
// ==========================================

function acceptRequest(requestId) {

    const currentUser =
        getCurrentUser();

    const requests =
        getRequests();

    const request =
        requests.find(
            function(item) {

                return item.id === requestId;

            }
        );

    if (!request) {

        alert(
            "Request not found."
        );

        return;
    }

    if (request.requesterEmail === currentUser) {

        alert(
            "❌ You cannot accept your own request."
        );

        return;
    }

    if (request.status !== "open") {

        alert(
            "This request is no longer available."
        );

        return;
    }

    request.status =
        "accepted";

    request.acceptedBy =
        currentUser;

    request.acceptedAt =
        new Date().toISOString();

    saveRequests(
        requests
    );

    addNotification(
        request.requesterEmail,
        "accepted",
        request
    );

    alert(
        "🤝 Request accepted!\n\n" +
        "You can now find it under Accepted Tasks."
    );

    renderNearbyRequests();

}
// ==========================================
// COMPLETE LOST REQUEST
// ==========================================

app.post("/api/requests/:id/complete", async (req, res) => {

    try {

        const { id } = req.params;
        const { helperEmail } = req.body;

        const requestsCollection =
            client
                .db("CampusLost")
                .collection("requests");

        const request =
            await requestsCollection.findOne({
                _id: new (require("mongodb").ObjectId)(id)
            });

        if (!request) {

            return res.status(404).json({
                message: "Request not found."
            });

        }

        // Only the student who accepted it can complete it
        if (request.acceptedBy !== helperEmail) {

            return res.status(403).json({
                message:
                    "Only the student who accepted this request can complete it."
            });

        }

        // It must currently be in progress
        if (request.status !== "In Progress") {

            return res.status(400).json({
                message:
                    "This request is not currently in progress."
            });

        }

        const completedAt =
            new Date();

        const result =
            await requestsCollection.updateOne(
                {
                    _id: request._id,
                    status: "In Progress",
                    acceptedBy: helperEmail
                },
                {
                    $set: {
                        status: "Completed",
                        completedAt: completedAt
                    }
                }
            );

        if (result.modifiedCount === 0) {

            return res.status(409).json({
                message:
                    "The request could not be completed."
            });

        }

        // ==========================================
        // EMAIL STUDENT A
        // ==========================================

        await emailTransporter.sendMail({

            from:
                `"CampusLost" <${process.env.EMAIL_USER}>`,

            to:
                request.studentEmail,

            subject:
                `CampusLost: Your ${request.item} request is completed 📧`,

            text:
                `Hello ${request.studentName},

Your CampusLost request for "${request.item}" has been marked as completed.

Status: Completed

The student who accepted your request has completed the task.

Thank you for using CampusLost.

CampusLost Team`

        });

        res.json({

            message:
                "Task completed successfully and Student A has been notified! 📧"

        });

    } catch (error) {

        console.error(
            "Complete request error:",
            error
        );

        res.status(500).json({

            message:
                "Server error while completing request.",

            error:
                error.message

        });

    }

});

// ==========================================
// RENDER MY REQUESTS - BACKEND
// ==========================================

async function renderMyRequests() {

    const container =
        document.getElementById(
            "myRequestsContainer"
        );

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return;
    }

    try {

        const response =
            await fetch(
                "http://localhost:3000/api/requests"
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load requests."
            );

        }

        const myRequests =
            data.requests.filter(
                function(request) {

                    return (
                        request.studentEmail ===
                        currentUser
                    );

                }
            );

        if (myRequests.length === 0) {

            container.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        📋
                    </div>

                    <h3>
                        No requests yet
                    </h3>

                    <p>
                        You haven't raised a lost-item request.
                    </p>

                    <button
                        class="primary-btn"
                        onclick="showRequestForm()"
                    >
                        + Raise a Request
                    </button>

                </div>

            `;

            return;
        }

        container.innerHTML =
            myRequests
                .map(
                    function(request) {

                        return `

                            <div class="request-card">

                                ${request.image ? `<img src="${request.image}" class="request-image" alt="Photo of ${escapeHTML(request.item)}" loading="lazy">` : `<div class="item-image">🎒</div>`}

                                <div class="request-info">

                                    <h3>
                                        ${escapeHTML(request.item)}
                                    </h3>

                                    <p>
                                        📍
                                        ${escapeHTML(request.location)}
                                    </p>

                                    <p>
                                        🕐 Posted:
                                        ${formatDateTime(
                                            request.createdAt
                                        )}
                                    </p>

                                    ${
                                        request.acceptedAt
                                        ?
                                        `
                                        <p>
                                            🤝 Accepted:
                                            ${formatDateTime(
                                                request.acceptedAt
                                            )}
                                        </p>
                                        `
                                        :
                                        ""
                                    }

                                    ${
                                        request.completedAt
                                        ?
                                        `
                                        <p>
                                            ✅ Completed:
                                            ${formatDateTime(
                                                request.completedAt
                                            )}
                                        </p>
                                        `
                                        :
                                        ""
                                    }

                                    <span class="status ${
                                        getBackendStatusClass(
                                            request.status
                                        )
                                    }">
                                        ${getBackendStatusText(
                                            request.status
                                        )}
                                    </span>
                                    ${request.acceptedBy ? `<button class="help-btn" onclick="openRequestChat('${request._id}')">💬 Chat with helper</button>` : ""}
                                </div>
                            </div>
                        `;

                    }
                )
                .join("");

    } catch (error) {

        console.error(
            "Load my requests error:",
            error
        );

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load your requests
                </h3>

                <p>
                    Please make sure the CampusLost server is running.
                </p>

            </div>

        `;

    }

}


// ==========================================
// BACKEND STATUS HELPERS
// ==========================================

function getBackendStatusClass(status) {

    if (status === "Open") {
        return "open";
    }

    if (status === "In Progress") {
        return "accepted";
    }

    if (status === "Completed") {
        return "completed-status";
    }

    return "";

}


function getBackendStatusText(status) {

    if (status === "Open") {
        return "🔴 Open";
    }

    if (status === "In Progress") {
        return "🟡 In Progress";
    }

    if (status === "Completed") {
        return "🟢 Completed";
    }

    return status;

}


// ==========================================
// RENDER ACCEPTED TASKS - BACKEND
// ==========================================

async function renderAcceptedTasks() {

    const container =
        document.getElementById("acceptedTasksContainer");

    const currentUser =
        getCurrentUser();

    try {

        const response =
            await fetch(
                "http://localhost:3000/api/requests"
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load accepted tasks."
            );

        }

        const acceptedTasks =
            data.requests.filter(function(request) {

                return (
                    request.acceptedBy === currentUser &&
                    request.status === "In Progress"
                );

            });

        if (acceptedTasks.length === 0) {

            container.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        🤝
                    </div>

                    <h3>
                        No accepted tasks
                    </h3>

                    <p>
                        Requests you accept will appear here.
                    </p>

                </div>

            `;

            return;
        }

        container.innerHTML =
            acceptedTasks.map(function(request) {

                return `

                    <div class="request-card">

                        ${request.image
                            ? `<img src="${request.image}" class="request-image" alt="Photo of ${escapeHTML(request.item)}" loading="lazy" onerror="this.style.display='none'">`
                            : `<div class="item-image">🎒</div>`
                        }

                        <div class="request-info">

                            <h3>
                                ${escapeHTML(request.item)}
                            </h3>

                            <p>
                                📍 ${escapeHTML(request.location)}
                            </p>

                            <p>
                                👤 Requested by:
                                ${escapeHTML(request.studentName)}
                            </p>

                            <p>
                                🆔 Student ID:
                                ${escapeHTML(request.studentId)}
                            </p>

                            <p>
                                📞 Contact:
                                ${escapeHTML(request.phone)}
                            </p>

                            <p>
                                🕐 Accepted:
                                ${formatDateTime(request.acceptedAt)}
                            </p>

                            <p class="description-text">
                                ${escapeHTML(request.description)}
                            </p>

                            <span class="status accepted">
                                🟡 In Progress
                            </span>

                        </div>

                        <button class="help-btn" onclick="openRequestChat('${request._id}')">💬 Chat with requester</button>
                        <button
                            class="complete-btn"
                            onclick="completeBackendRequest('${request._id}')"
                        >
                            ✓ Task Completed
                        </button>

                    </div>

                `;

            }).join("");

    } catch (error) {

        console.error(
            "Load accepted tasks error:",
            error
        );

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load accepted tasks
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;

    }

}
// ==========================================
// COMPLETE BACKEND REQUEST
// ==========================================

async function completeBackendRequest(requestId) {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        alert("Please login first.");
        return;

    }

    const confirmation =
        confirm(
            "Have you completed this lost-item task?"
        );

    if (!confirmation) {
        return;
    }

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/requests/${requestId}/complete`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        helperEmail:
                            currentUser

                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                "❌ " +
                data.message
            );

            return;

        }

        alert(
            "✅ " +
            data.message
        );

        // Refresh accepted tasks
        renderAcceptedTasks();

    } catch (error) {

        console.error(
            "Complete request error:",
            error
        );

        alert(
            "❌ Unable to connect to CampusLost server."
        );

    }

}
// ==========================================
// COMPLETE REQUEST
// ==========================================

function completeRequest(requestId) {

    const currentUser =
        getCurrentUser();

    const requests =
        getRequests();

    const request =
        requests.find(
            function(item) {

                return item.id === requestId;

            }
        );

    if (!request) {

        alert(
            "Request not found."
        );

        return;
    }

    if (
        request.acceptedBy !==
        currentUser
    ) {

        alert(
            "❌ Only the student who accepted this request can mark it as completed."
        );

        return;
    }

    const confirmation =
        confirm(
            "Have you completed this task?\n\n" +
            "Click OK to mark it as completed."
        );

    if (!confirmation) {
        return;
    }

    request.status =
        "completed";

    request.completedAt =
        new Date().toISOString();

    saveRequests(
        requests
    );

    addNotification(
        request.requesterEmail,
        "completed",
        request
    );

    alert(
        "✅ Task marked as completed!"
    );

    renderAcceptedTasks();

}


// ==========================================
// HISTORY
// ==========================================

async function renderHistory() {
    const container = document.getElementById("historyContainer");
    const currentUser = getCurrentUser();
    if (!currentUser) {
        container.innerHTML = `<div class="empty-state"><h3>Please log in</h3><p>Log in to view your completed requests.</p></div>`;
        return;
    }

    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><h3>Loading history…</h3></div>`;
    try {
        const response = await fetch(`http://localhost:3000/api/history?email=${encodeURIComponent(currentUser)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load history.");
        const history = data.requests || [];

        if (history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📜</div>
                    <h3>No completed requests yet</h3>
                    <p>When a request you posted or accepted is completed, it will appear here.</p>
                </div>`;
            return;
        }

        container.innerHTML = history.map(request => `
            <div class="history-card">
                ${request.image ? `<img src="${request.image}" class="history-image" alt="Photo of ${escapeHTML(request.item)}" loading="lazy">` : `<div class="item-image">🎒</div>`}
                <div class="history-details">
                    <h3>${escapeHTML(request.item || "Lost item")}</h3>
                    <p>📍 ${escapeHTML(request.location || "Location not provided")}</p>
                    <p>🕐 Posted: ${formatDateTime(request.createdAt)}</p>
                    <p>🤝 Accepted: ${request.acceptedAt ? formatDateTime(request.acceptedAt) : "—"}</p>
                    <p>✅ Completed: ${request.completedAt ? formatDateTime(request.completedAt) : "—"}</p>
                </div>
                <div><span class="completed">✓ ${escapeHTML(request.status || "Completed")}</span>${request.status === "In Progress" ? `<button class="help-btn" onclick="openRequestChat('${request._id}')">💬 Chat</button>` : ""}</div>
            </div>`).join("");
    } catch (error) {
        console.error("Load history error:", error);
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Couldn't load history</h3><p>Make sure the backend and MongoDB are running, then reopen History.</p><button class="primary-btn" onclick="renderHistory()">Try again</button></div>`;
    }
}


// ==========================================
// REQUEST CHAT
// ==========================================
async function openRequestChat(requestId) {
    const email = getCurrentUser();
    if (!email) { alert("Please log in to use chat."); return; }
    let modal = document.getElementById("campusChatModal");
    if (!modal) {
        modal = document.createElement("div"); modal.id = "campusChatModal";
        modal.innerHTML = `<div class="campus-chat-panel"><div class="campus-chat-head"><strong>Request chat</strong><button type="button" id="campusChatClose" aria-label="Close chat">✕</button></div><div id="campusChatMessages" class="campus-chat-messages">Loading messages…</div><form id="campusChatForm"><input id="campusChatInput" maxlength="2000" placeholder="Write a message…" required><button class="primary-btn" type="submit">Send</button></form></div>`;
        document.body.appendChild(modal);
        modal.querySelector("#campusChatClose").onclick = () => modal.classList.remove("open");
        modal.querySelector("#campusChatForm").onsubmit = async e => {
            e.preventDefault(); const input = modal.querySelector("#campusChatInput"); const message = input.value.trim(); if (!message) return;
            try { const r = await fetch(`http://localhost:3000/api/requests/${encodeURIComponent(modal.dataset.requestId)}/messages`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email, message})}); const d = await r.json(); if (!r.ok) throw new Error(d.message || "Message could not be sent."); input.value=""; await loadRequestChat(modal.dataset.requestId,email); } catch(err) { alert(err.message); }
        };
    }
    modal.dataset.requestId = requestId; modal.classList.add("open"); await loadRequestChat(requestId,email);
}
async function loadRequestChat(requestId,email) {
    const box = document.getElementById("campusChatMessages"); if (!box) return; box.textContent = "Loading messages…";
    try { const r = await fetch(`http://localhost:3000/api/requests/${encodeURIComponent(requestId)}/messages?email=${encodeURIComponent(email)}`); const d = await r.json(); if (!r.ok) throw new Error(d.message || "Unable to load chat.");
        box.innerHTML = d.messages.length ? d.messages.map(m => `<div class="campus-chat-message ${String(m.email).toLowerCase()===String(email).toLowerCase()?"mine":"theirs"}"><small>${escapeHTML(m.name || m.email)} · ${formatDateTime(m.createdAt)}</small><p>${escapeHTML(m.message)}</p></div>`).join("") : '<p class="chat-empty">No messages yet. Say hello!</p>'; box.scrollTop = box.scrollHeight;
    } catch(err) { box.textContent = err.message; }
}

// ==========================================
// NOTIFICATIONS
// ==========================================

function addNotification(
    receiverEmail,
    type,
    request
) {

    const notifications =
        getNotifications();

    let message = "";

    if (type === "accepted") {

        message =
            `🤝 Your "${request.item}" request has been accepted.`;

    }

    if (type === "completed") {

        message =
            `✅ Your "${request.item}" request has been marked as completed.`;

    }

    notifications.unshift({

        id:
            Date.now().toString(),

        receiverEmail:
            receiverEmail,

        message:
            message,

        requestId:
            request.id,

        createdAt:
            new Date().toISOString(),

        read:
            false

    });

    saveNotifications(
        notifications
    );

    updateNotificationBadge();

}


// ==========================================
// RENDER NOTIFICATIONS
// ==========================================

async function fetchServerNotifications() {
    const email = getCurrentUser();
    if (!email) return [];
    const response = await fetch(`http://localhost:3000/api/notifications?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load notifications.");
    return Array.isArray(data.notifications) ? data.notifications : [];
}

async function renderNotifications() {
    const container = document.getElementById("notificationsContainer");
    if (!container) return;
    container.innerHTML = '<div class="empty-state"><p>Loading notifications…</p></div>';
    try {
        const notifications = await fetchServerNotifications();
        if (!notifications.length) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><h3>No notifications</h3><p>Updates about new requests and chat messages will appear here.</p></div>`;
            return;
        }
        container.innerHTML = notifications.map(notification => {
            const icon = notification.type === "message" ? "💬" : notification.type === "request_created" ? "📢" : "🔔";
            const id = encodeURIComponent(String(notification.requestId || ""));
            return `<div role="button" tabindex="0" class="notification-card ${notification.read ? "" : "unread"}" onclick="openNotificationRequest('${id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openNotificationRequest('${id}')}" aria-label="Open related request"><div class="notification-icon">${icon}</div><div><p>${escapeHTML(notification.message)}</p><small>${formatDateTime(notification.createdAt)}</small></div></div>`;
        }).join("");
        const unreadIds = notifications.filter(n => !n.read).map(n => n._id).filter(Boolean);
        if (unreadIds.length) {
            await fetch("http://localhost:3000/api/notifications/read", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: getCurrentUser(), ids: unreadIds }) });
        }
        updateNotificationBadge();
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><h3>Notifications unavailable</h3><p>${escapeHTML(err.message)}. Make sure the CampusLost backend is running.</p></div>`;
    }
}

// Open the related request from a notification instead of leaving notifications as a dead-end.
function openNotificationRequest(encodedRequestId) {
    const requestId = decodeURIComponent(String(encodedRequestId || ""));
    const currentUser = getCurrentUser();
    const request = getRequests().find(item => String(item.id) === requestId || String(item._id) === requestId);
    if (!request) {
        showMyRequests();
        alert("This request is no longer available in the local list. Check My Requests or History.");
        return;
    }
    const status = String(request.status || "").toLowerCase();
    if (request.requesterEmail === currentUser) {
        if (status === "completed" || status === "in progress") showHistory();
        else showMyRequests();
    } else if (request.acceptedBy === currentUser) {
        if (status === "completed") showHistory();
        else showAcceptedTasks();
    } else {
        showRequests();
    }
}

// ==========================================
// NOTIFICATION BADGE
// ==========================================

async function updateNotificationBadge() {
    const badge = document.getElementById("notificationBadge");
    const email = getCurrentUser();
    if (!badge) return;
    if (!email) { badge.textContent = "0"; badge.classList.add("hidden"); return; }
    try {
        const notifications = await fetchServerNotifications();
        const unread = notifications.filter(n => !n.read).length;
        badge.textContent = String(unread);
        badge.classList.toggle("hidden", unread === 0);
    } catch (err) {
        // Keep the UI usable if the backend is temporarily offline.
        console.warn("Notification badge refresh failed:", err.message);
    }
}

async function markNotificationsRead() {
    const email = getCurrentUser();
    if (!email) return;
    try {
        await fetch("http://localhost:3000/api/notifications/read", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
    } catch (err) { console.warn("Could not mark notifications read:", err.message); }
    updateNotificationBadge();
    renderNotifications();
}

// ==========================================
// STATUS HELPERS
// ==========================================

function getStatusClass(status) {

    if (status === "open") {
        return "open";
    }

    if (status === "accepted") {
        return "accepted";
    }

    if (status === "completed") {
        return "completed-status";
    }

    return "";

}


function getStatusText(status) {

    if (status === "open") {
        return "🔴 Open";
    }

    if (status === "accepted") {
        return "🟡 In Progress";
    }

    if (status === "completed") {
        return "🟢 Completed";
    }

    return status;

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// FEEDBACK
// ==========================================

function submitFeedback() {

    const feedback =
        document.getElementById(
            "feedback"
        ).value;

    if (feedback.trim() === "") {

        alert(
            "Please enter your feedback."
        );

        return;
    }

    alert(
        "Thank you for your feedback! ⭐"
    );

    document.getElementById(
        "feedback"
    ).value = "";

}
function submitFeedback() {

    const feedback =
        document.getElementById(
            "feedback"
        ).value;

    if (feedback.trim() === "") {

        alert(
            "Please enter your feedback."
        );

        return;
    }

    alert(
        "Thank you for your feedback! ⭐"
    );

    document.getElementById(
        "feedback"
    ).value = "";

}


// ==========================================
// REGISTRATION PAGE NAVIGATION
// ==========================================

function showLoginPage() {

    document
        .getElementById("registerPage")
        .classList.add("hidden");

    document
        .getElementById("loginPage")
        .classList.remove("hidden");

}


function showRegisterPage() {

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("registerPage")
        .classList.remove("hidden");

}
// ==========================================
// REGISTER ACCOUNT
// ==========================================

document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const name =
                document.getElementById(
                    "registerName"
                ).value.trim();

            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim().toLowerCase();

            const studentId =
                document.getElementById(
                    "registerStudentId"
                ).value.trim();

            const password =
                document.getElementById(
                    "registerPassword"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            // ------------------------------
            // BASIC VALIDATION
            // ------------------------------

            if (
                !name ||
                !email ||
                !studentId ||
                !password ||
                !confirmPassword
            ) {

                alert(
                    "Please fill in all fields."
                );

                return;
            }


            if (password.length < 6) {

                alert(
                    "Password must contain at least 6 characters."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match."
                );

                return;
            }


            // ------------------------------
            // SEND DATA TO BACKEND
            // ------------------------------

            try {

                const response =
                    await fetch(
                        "http://localhost:3000/api/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                name:
                                    name,

                                email:
                                    email,

                                studentId:
                                    studentId,

                                password:
                                    password

                            })
                        }
                    );


                const data =
                    await response.json();


                // ------------------------------
                // BACKEND RESPONSE
                // ------------------------------

                if (!response.ok) {

                    alert(
                        "❌ " +
                        data.message
                    );

                    return;
                }


                alert(
                    "✅ " +
                    data.message
                );


                // Clear registration form

                document
                    .getElementById(
                        "registerForm"
                    )
                    .reset();


                // Return to login

                showLoginPage();


                // Put email into login field

                document
                    .getElementById(
                        "email"
                    )
                    .value =
                    email;


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                alert(
                    "❌ Unable to connect to CampusLost server."
                );

            }

        }
    );
async function testBackend() {

    try {

        const response =
            await fetch("http://localhost:3000/api/test");

        const data =
            await response.json();

        console.log("Backend response:", data);

        alert(data.message);

    } catch (error) {

        console.error("Backend connection error:", error);

        alert(
            "❌ Could not connect to CampusLost backend."
        );

    }

}