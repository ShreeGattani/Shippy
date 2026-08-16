# SHIPPY — Don't order alone. Shippy it.

**Shippy** is a premium private university group-ordering and co-delivery web application designed for the Shiv Nadar University (SNU) campus. It enables students to share carts, split delivery/packaging fees proportionally, and collectively unlock free shipping thresholds (e.g., Blinkit).

---

## 📂 Project Structure

```text
Shippy/
├── .env                  # Environment secrets (Port, DB URI, OAuth keys)
├── .gitignore            # Git exclusion definitions (ignores node_modules, .env, dist)
├── index.html            # Main HTML wrapper template
├── package.json          # Dependency specifications and dev scripts
├── package-lock.json     # Lockfile for exact dependency versions
├── postcss.config.js     # PostCSS configuration for styles
├── server.js              # Express backend server with Socket.io web socket rooms
├── store.js               # Database abstraction layer (MemoryStore & MongoDB)
├── tsconfig.json          # TypeScript base configuration
├── tsconfig.app.json      # TypeScript frontend application settings
├── tsconfig.node.json     # TypeScript Vite config runner settings
├── vite.config.ts         # Vite server and bundler options
├── README.md             # Project documentation and setup guide
└── src/
    ├── App.css           # Legacy/Boilerplate app styles
    ├── App.tsx           # Main application view manager & layout router
    ├── config.ts         # Client configuration (API endpoints & OAuth client IDs)
    ├── index.css         # Styling system entry (Tailwind CSS v4 base & custom theme tokens)
    ├── main.tsx          # React application bootstrapping engine
    ├── types.ts          # Shared TypeScript type interfaces (Order, User, Message, Item)
    ├── assets/
    │   ├── hero.png      # Hero banner illustration
    │   ├── react.svg     # React logo asset
    │   └── vite.svg      # Vite logo asset
    └── components/
        ├── CampusMap.tsx # 2D map component displaying hubs with live beacons
        ├── CreateOrder.tsx# Drawer/Modal form to launch new group orders
        ├── HomeFeed.tsx  # Carts catalog feed with search, filters, and progress bars
        ├── Login.tsx     # Student authentication panel with hostel selector
        ├── OrderRoom.tsx # Live chat room, split payment calculator, and member drawer
        ├── Profile.tsx   # User profile page displaying savings metrics & historical logs
        └── Radar.tsx     # Radar sweep component mapping nearby active joinable carts
```

---

## 🚀 Setup & Installation Steps

### Step 1: Install Prerequisites
Ensure you have the following software installed on your machine:
1. **Node.js** (v18.0.0 or higher recommended) — [Download here](https://nodejs.org/)
2. **git** — [Download here](https://git-scm.com/)

---

### Step 2: Clone & Install Dependencies
Open your terminal and run:
```bash
# 1. Clone this repository
git clone https://github.com/ShreeGattani/Shippy.git

# 2. Navigate into the project folder
cd Shippy

# 3. Install required node packages
npm install
```

---

### Step 3: Configure Environment variables
Create a `.env` file in the root folder of the project (`Shippy/.env`):
```env
# Backend server port
PORT=5001

# Google OAuth Keys (Required for real Google logins, see Step 5)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Frontend Google OAuth Key
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id

# MongoDB Database URI (Optional - see Step 4)
# MONGO_URI=mongodb://localhost:27017/shippy
```

---

### Step 4: Setup Database (Optional)

Shippy supports two database modes:
1. **Sandbox / Memory Mode (Default - No Setup Required):** If `MONGO_URI` is omitted from `.env`, Shippy starts automatically using an in-memory database preloaded with mock SNU students (`Shree`, `Riya`, `Arjun`, `Kabir`) for instant testing.
2. **MongoDB Production Mode:** 
   - Install and start a local MongoDB instance, or create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Add your connection string to the `.env` file:
     ```env
     MONGO_URI=mongodb://localhost:27017/shippy
     ```

---

### Step 5: Setup Google OAuth Credentials (Optional)

To enable real Google logins instead of the Sandbox Mode simulation:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **Shippy**.
3. Search for **APIs & Services** > **OAuth consent screen**:
   - Choose **External** user type and complete the app registration fields.
4. Navigate to **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Select **Web application** as the application type.
   - Under **Authorized JavaScript origins**, add:
     - `http://localhost:5173`
   - Under **Authorized redirect URIs**, add:
     - `http://localhost:5173`
5. Click **Create** and copy your **Client ID** and **Client Secret**.
6. Paste them into your `.env` file (see Step 3).

---

## 🛠️ Running the Application

### 1. Run in Development Mode
To boot up both the frontend dev server (Vite) and the backend API server (Node/Express with Socket.io) concurrently:
```bash
npm run dev
```
- Open [http://localhost:5173/](http://localhost:5173/) in your web browser.
- **Backend logs** will stream on Port `5001`.

### 2. Build for Production
To bundle compile and run the production environment:
```bash
# Compile and build the React app assets
npm run build

# Start the Node.js production server
npm start
```