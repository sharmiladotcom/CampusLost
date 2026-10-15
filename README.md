# CampusLost

A campus lost-item request app with an Express + MongoDB backend.

## Run locally

1. Install Node.js (LTS recommended).
2. In `backend/`, copy `.env.example` to `.env` and fill in your MongoDB connection string. Email credentials are optional unless you want email notifications. Never commit `.env`.
3. In PowerShell, run:

   ```powershell
   cd backend
   npm install
   npm start
   ```

4. Open `index.html` through a local web server (for example, VS Code Live Server). Keep the backend running at `http://localhost:3000`. Opening the HTML directly may work in some browsers but a local server is recommended.

## Fixes in this revision

- Completed history is fetched from MongoDB through `/api/history` rather than localStorage, which was why backend-created requests never appeared in History.
- Item photos are sent with the create-request API and saved in MongoDB as image data URLs, so other users can see the photo instead of only the uploader's browser.
- Image uploads are limited to image files up to 2 MB to avoid oversized database requests.
- Added loading, error, and retry states for History, plus responsive history photo styling.

## Important limitations

- This prototype stores small photos as base64 in MongoDB. For a production deployment, use object storage (such as Cloudinary, Firebase Storage, or S3) and store only the resulting image URL in MongoDB.
- API requests currently use `http://localhost:3000`; this is for local development. For other people to use the deployed app, deploy the backend and replace these URLs with the deployed API URL.
- Keep `.env` private. Do not upload database credentials or email app passwords to GitHub.

## Workflow fixes in this version
- Restores the original project HTML and CSS as the base (no visual redesign).
- Nearby Requests now only renders database records whose status is `Open`, and excludes the signed-in user's own requests. Accepting a request updates the database and refreshes the open list.
- Raise a Request opens, scrolls to, and focuses the request form.
- Adds chat buttons for the requester and accepted helper, with messages stored in MongoDB's `messages` collection.
- History includes in-progress and completed requests.

### Setup
1. Keep your existing `backend/.env` private and copy it into this extracted project's `backend` folder. Do not share it.
2. In a terminal: `cd backend`, then `npm install`, then `npm start`.
3. Open `index.html` using VS Code Live Server.
4. Chat only becomes available after a request is accepted. Test using two different student accounts.

Important: this project currently identifies API users using the email sent by the browser, consistent with its existing architecture. Before public deployment, implement real server-side session/JWT authentication and authorize using the verified identity.

## Shared photos and server-backed notifications
- Item photos are sent to the backend as image data and stored with the MongoDB request record, so every browser that loads requests from the same backend/database can see the photo. Keep uploads at or below 2 MB.
- New-request notifications are stored in MongoDB for all other registered students.
- A chat message creates a MongoDB notification for the other chat participant.
- The frontend checks for new notifications every 12 seconds and displays unread counts. This is polling, not instant push; the backend must be running and all users must use the same deployed backend/database.
- Notifications are read from MongoDB and are not limited to the sender's local browser storage.
