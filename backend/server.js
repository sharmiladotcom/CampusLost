
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
require("dotenv").config();

const mongoURI = process.env.MONGO_URI;
const { createUserObject } = require("./models/User");

const app = express();
const port = 3000;

app.use(cors());
// Allow small item photos to travel with requests (base64 data URLs).
app.use(express.json({ limit: "8mb" }));

const client = mongoURI ? new MongoClient(mongoURI) : null;

let db = null;

const emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Database connection check
function getCollection(name) {
    if (!db) {
        throw new Error("MongoDB is not connected. Check MONGO_URI.");
    }

    return db.collection(name);
}

// Email helper
async function sendEmail(options) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.log("Email settings are missing. Email was not sent.");
        return false;
    }

    try {
        await emailTransporter.sendMail({
            from: `"CampusLost" <${process.env.EMAIL_USER}>`,
            ...options
        });
        return true;
    } catch (err) {
        console.error("Email sending failed:", err.message);
        return false;
    }
}

// Home route
app.get("/", (req, res) => {
    res.json({ message: "CampusLost Backend is running!" });
});

// API test
app.get("/api/test", (req, res) => {
    res.json({
        message: "CampusLost API is working!",
        status: "success",
        database: db ? "connected" : "disconnected"
    });
});

// Register
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, studentId, password } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof email !== "string" || !email.trim() ||
            typeof studentId !== "string" || !studentId.trim() ||
            typeof password !== "string" || !password
        ) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const pattern =
            /^(23|24|25|26)b01a\d{4}@svecw\.edu\.in$/i;

        if (!pattern.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please use a valid SVECW college email ID."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters."
            });
        }

        const users = getCollection("users");

        const existing = await users.findOne({ email: cleanEmail });

        if (existing) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = createUserObject({
            name: name.trim(),
            email: cleanEmail,
            studentId: studentId.trim(),
            password: hashed
        });

        const result = await users.insertOne(user);

        res.status(201).json({
            message: "CampusLost account created successfully!",
            userId: result.insertedId
        });
    } catch (err) {
        console.error("Registration error:", err);

        res.status(err.message.includes("MongoDB is not connected") ? 503 : 500)
            .json({
                message: "Unable to register. Please try again later."
            });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" || !email.trim() ||
            typeof password !== "string" || !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const users = getCollection("users");

        const user = await users.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful!",
            user: {
                name: user.name,
                email: user.email,
                studentId: user.studentId
            }
        });
    } catch (err) {
        console.error("Login error:", err);

        res.status(err.message.includes("MongoDB is not connected") ? 503 : 500)
            .json({
                message: "Server error during login."
            });
    }
});

// Create lost request
app.post("/api/requests", async (req, res) => {
    try {
        const {
            studentName, studentId, studentEmail,
            phone, item, description, location, image
        } = req.body;

        const fields = [
            studentName, studentId, studentEmail,
            phone, item, description, location
        ];

        if (fields.some(v => typeof v !== "string" || !v.trim())) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const request = {
            studentName: studentName.trim(),
            studentId: studentId.trim(),
            studentEmail: studentEmail.trim().toLowerCase(),
            phone: phone.trim(),
            item: item.trim(),
            description: description.trim(),
            location: location.trim(),
            image: typeof image === "string" && image.startsWith("data:image/") ? image : "",
            status: "Open",
            acceptedBy: null,
            acceptedByName: null,
            acceptedByStudentId: null,
            acceptedAt: null,
            completedAt: null,
            createdAt: new Date()
        };

        const result = await getCollection("requests").insertOne(request);
        const requestId = String(result.insertedId);

        // Persist a notification for every other registered student.
        const otherStudents = await getCollection("users").find(
            { email: { $ne: request.studentEmail } },
            { projection: { email: 1 } }
        ).toArray();
        if (otherStudents.length) {
            const createdAt = new Date();
            await getCollection("notifications").insertMany(otherStudents
                .filter(user => user.email)
                .map(user => ({
                    receiverEmail: String(user.email).toLowerCase(),
                    type: "request_created",
                    message: `${request.studentName} created a new lost-item request: "${request.item}".`,
                    requestId,
                    createdAt,
                    read: false
                })));
        }

        res.status(201).json({
            message: "Lost request created successfully!",
            requestId
        });
    } catch (err) {
        console.error("Create request error:", err);
        res.status(err.message.includes("MongoDB is not connected") ? 503 : 500)
            .json({ message: "Unable to create lost request." });
    }
});

// Get all lost requests
app.get("/api/requests", async (req, res) => {
    try {
        const requests = await getCollection("requests")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json({
            message: "Lost requests retrieved successfully.",
            requests
        });
    } catch (err) {
        console.error("Get requests error:", err);
        res.status(err.message.includes("MongoDB is not connected") ? 503 : 500)
            .json({ message: "Unable to retrieve lost requests." });
    }
});

// Get completed requests involving the signed-in student.
app.get("/api/history", async (req, res) => {
    try {
        const email = String(req.query.email || "").trim().toLowerCase();
        if (!email) {
            return res.status(400).json({ message: "Student email is required." });
        }
        const requests = await getCollection("requests")
            .find({
                status: { $in: ["In Progress", "Completed"] },
                $or: [{ studentEmail: email }, { acceptedBy: email }]
            })
            .sort({ completedAt: -1, createdAt: -1 })
            .toArray();
        res.json({ message: "History retrieved successfully.", requests });
    } catch (err) {
        console.error("Get history error:", err.message);
        res.status(err.message.includes("MongoDB is not connected") ? 503 : 500)
            .json({ message: "Unable to retrieve history." });
    }
});

// Accept lost request
app.post("/api/requests/:id/accept", async (req, res) => {
    try {
        const { id } = req.params;
        const { helperName, helperStudentId, helperEmail } = req.body;

        if (!helperName || !helperStudentId || !helperEmail) {
            return res.status(400).json({
                message: "Helper details are required."
            });
        }

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid request ID."
            });
        }

        const email = helperEmail.trim().toLowerCase();
        const requests = getCollection("requests");

        const request = await requests.findOne({
            _id: new ObjectId(id)
        });

        if (!request) {
            return res.status(404).json({
                message: "Lost request not found."
            });
        }

        if (request.studentEmail === email) {
            return res.status(400).json({
                message: "You cannot accept your own request."
            });
        }

        if (request.status !== "Open") {
            return res.status(409).json({
                message: "This request is no longer open."
            });
        }

        const acceptedAt = new Date();

        const result = await requests.updateOne(
            { _id: new ObjectId(id), status: "Open" },
            {
                $set: {
                    status: "In Progress",
                    acceptedBy: email,
                    acceptedByName: helperName.trim(),
                    acceptedByStudentId: helperStudentId.trim(),
                    acceptedAt
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(409).json({
                message: "This request was already accepted."
            });
        }

        const sent = await sendEmail({
            to: request.studentEmail,
            subject: `CampusLost: Your ${request.item} request was accepted`,
            text: `Hello ${request.studentName},

Your request for "${request.item}" has been accepted.

Helper: ${helperName}
Student ID: ${helperStudentId}
Status: In Progress

CampusLost Team`
        });

        res.json({
            message: "Request accepted successfully.",
            status: "In Progress",
            emailSent: sent
        });
    } catch (err) {
        console.error("Accept request error:", err);
        res.status(err.message.includes("MongoDB is not connected") ? 503 : 500)
            .json({ message: "Unable to accept request." });
    }
});

// Notifications are stored centrally so they appear on other devices/browsers too.
app.get("/api/notifications", async (req, res) => {
    try {
        const email = String(req.query.email || "").trim().toLowerCase();
        if (!email) return res.status(400).json({ message: "Email is required." });
        const notifications = await getCollection("notifications")
            .find({ receiverEmail: email }).sort({ createdAt: -1 }).limit(200).toArray();
        res.json({ notifications: notifications.map(n => ({ ...n, _id: String(n._id) })) });
    } catch (err) {
        console.error("Get notifications error:", err);
        res.status(500).json({ message: "Unable to load notifications." });
    }
});

app.patch("/api/notifications/read", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(ObjectId.isValid).map(id => new ObjectId(id)) : [];
        if (!email) return res.status(400).json({ message: "Email is required." });
        const filter = { receiverEmail: email, read: false };
        if (ids.length) filter._id = { $in: ids };
        await getCollection("notifications").updateMany(filter, { $set: { read: true } });
        res.json({ message: "Notifications marked as read." });
    } catch (err) {
        console.error("Mark notifications read error:", err);
        res.status(500).json({ message: "Unable to update notifications." });
    }
});

// Request chat: only the requester and accepted helper may read or send messages.
app.get("/api/requests/:id/messages", async (req, res) => {
    try {
        const { id } = req.params; const email = String(req.query.email || "").trim().toLowerCase();
        if (!ObjectId.isValid(id) || !email) return res.status(400).json({message:"Valid request ID and email are required."});
        const request = await getCollection("requests").findOne({_id:new ObjectId(id)});
        if (!request) return res.status(404).json({message:"Request not found."});
        if (![request.studentEmail, request.acceptedBy].filter(Boolean).map(v=>String(v).toLowerCase()).includes(email)) return res.status(403).json({message:"Only the requester and accepted helper can access this chat."});
        const messages = await getCollection("messages").find({requestId:id}).sort({createdAt:1}).limit(500).toArray();
        res.json({messages:messages.map(m=>({...m,_id:undefined}))});
    } catch(err) { console.error("Get chat error:",err); res.status(500).json({message:"Unable to load messages."}); }
});
app.post("/api/requests/:id/messages", async (req, res) => {
    try {
        const { id } = req.params; const email = String(req.body.email || "").trim().toLowerCase(); const message = String(req.body.message || "").trim();
        if (!ObjectId.isValid(id) || !email || !message || message.length > 2000) return res.status(400).json({message:"A valid request, email, and message (1–2000 characters) are required."});
        const request = await getCollection("requests").findOne({_id:new ObjectId(id)});
        if (!request) return res.status(404).json({message:"Request not found."});
        if (![request.studentEmail, request.acceptedBy].filter(Boolean).map(v=>String(v).toLowerCase()).includes(email) || !request.acceptedBy) return res.status(403).json({message:"Chat is available only after a request is accepted, for the requester and helper."});
        const user = await getCollection("users").findOne({email});
        const doc = {requestId:id,email,name:user?.name || email,message,createdAt:new Date()};
        await getCollection("messages").insertOne(doc);
        const recipientEmail = String(email).toLowerCase() === String(request.studentEmail).toLowerCase()
            ? String(request.acceptedBy || "").toLowerCase()
            : String(request.studentEmail || "").toLowerCase();
        if (recipientEmail && recipientEmail !== email) {
            await getCollection("notifications").insertOne({
                receiverEmail: recipientEmail,
                type: "message",
                message: `${doc.name} sent you a message about "${request.item}".`,
                requestId: id,
                createdAt: doc.createdAt,
                read: false
            });
        }
        res.status(201).json({message:"Message sent.",item:doc});
    } catch(err) { console.error("Send chat error:",err); res.status(500).json({message:"Unable to send message."}); }
});

// Complete lost request
app.post("/api/requests/:id/complete", async (req, res) => {
    try {
        const { id } = req.params;
        const { helperEmail } = req.body;

        if (typeof helperEmail !== "string" || !helperEmail.trim()) {
            return res.status(400).json({
                message: "Helper email is required."
            });
        }

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid request ID."
            });
        }

        const email = helperEmail.trim().toLowerCase();
        const requests = getCollection("requests");
        const request = await requests.findOne({
            _id: new ObjectId(id)
        });

        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }

        if (request.acceptedBy !== email) {
            return res.status(403).json({
                message: "Only the student who accepted this request can complete it."
            });
        }

        if (request.status !== "In Progress") {
            return res.status(400).json({
                message: "This request is not currently in progress."
            });
        }

        const result = await requests.updateOne(
            {
                _id: new ObjectId(id),
                status: "In Progress",
                acceptedBy: email
            },
            { $set: { status: "Completed", completedAt: new Date() } }
        );

        if (result.modifiedCount === 0) {
            return res.status(409).json({
                message: "The request could not be completed."
            });
        }

        const sent = await sendEmail({
            to: request.studentEmail,
            subject: `CampusLost: Your ${request.item} request is completed`,
            text: `Hello ${request.studentName},

Your request for "${request.item}" has been marked as completed.

Thank you for using CampusLost.

CampusLost Team`
        });

        res.json({
            message: "Request completed successfully.",
            status: "Completed",
            emailSent: sent
        });
    } catch (err) {
        console.error("Complete request error:", err);
        res.status(err.message.includes("MongoDB is not connected") ? 503 : 500)
            .json({ message: "Unable to complete request." });
    }
});

// Test email
app.get("/api/test-email", async (req, res) => {
    const sent = await sendEmail({
        to: process.env.EMAIL_USER,
        subject: "CampusLost Email Test",
        text: "CampusLost backend email test."
    });

    if (!sent) {
        return res.status(500).json({
            message: "Email failed. Check EMAIL_USER and EMAIL_APP_PASSWORD."
        });
    }

    res.json({ message: "Test email sent successfully!" });
});

// Start server first, then connect to MongoDB
app.listen(port, () => {
    console.log(`CampusLost server running at http://localhost:${port}`);

    if (!mongoURI) {
        console.error("MONGO_URI is missing from the backend .env file.");
        return;
    }

    client.connect()
        .then(() => {
            db = client.db("CampusLost");
            console.log("MongoDB connected successfully!");
        })
        .catch(err => {
            console.error("MongoDB connection failed:", err.message);
        });
});
