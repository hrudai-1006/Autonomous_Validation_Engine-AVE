# How to Run the Autonomous Validation Engine (AVE)

Follow these steps to get the application up and running.

## 1. Prerequisites
Ensure you have the following installed:
-   **Python 3.10+** (3.13 tested)
-   **Node.js & npm**
-   **A Gemini API Key**

## 2. Backend Setup
The backend runs on FastAPI (Port 8000).

1.  **Navigate to the backend folder:**
    ```bash
    cd backend
    ```

2.  **Set up the Environment:**
    Ensure a `.env` file exists in the `backend` folder with your API key:
    ```env
    GEMINI_API_KEY=AIzaSy...
    # DATABASE_URL=... (Optional: Uncomment for PostgreSQL, defaults to SQLite)
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Backend Server (Robust Mode):**
    We bind to `0.0.0.0` to ensure the server accepts connections from all local interfaces (IPv4/IPv6).
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
    ```
    *You should see: `Uvicorn running on http://0.0.0.0:8001`*

## 3. Frontend Setup
The frontend is a React + Vite app.

1.  **Open a new terminal and navigate to the frontend folder:**
    ```bash
    cd frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # Ensure stable router version if you see a blank screen:
    npm install react-router-dom@6
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev -- --port 5500
    ```
    *Note: We specify port 5500 to match the backend's CORS configuration.*

## 4. Accessing the App
Open your browser and verify the following URLs:

*   **App Dashboard**: [http://localhost:5500](http://localhost:5500)
    *   *If that fails, try http://127.0.0.1:5500*
*   **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Troubleshooting
*   **App is loading indefinitely / Blank Screen?** 
    * Ensure the backend is running with `--host 0.0.0.0`.
    * Ensure you are using `react-router-dom@6` (Run `npm install react-router-dom@6`).
    * Check the browser console (F12) for errors.
*   **Uploads failing?** 
    * Check the backend terminal. If you see `429 Quota Exceeded`, your Gemini API key has hit its rate limit. Wait 1-2 minutes and try again.
*   **Port already in use?**
    * Identify the process: `lsof -i :8000`
    * Kill it: `kill -9 <PID>`
