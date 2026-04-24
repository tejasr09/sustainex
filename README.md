# 🌱 Sustainex

Sustainex is a full-stack web application focused on promoting sustainability through smart, user-driven insights and interactions. The platform enables users to engage with sustainability-focused tools, track inputs, and (future scope) analyze and store environmental impact data.

🔗 Live Demo: https://sustainex-omega.vercel.app/

---

## ✨ Features

* 🌐 Clean and responsive frontend UI
* ⚡ Fast deployment using modern hosting platforms
* 🔗 Frontend ↔ Backend integration via API
* 🧠 Scalable architecture (ready for DB + analytics)
* 📦 Modular code structure for easy expansion

---

## 🛠️ Tech Stack

### Frontend

* HTML / CSS / JavaScript (or React if applicable)
* Hosted on Vercel

### Backend

* Python (Flask / FastAPI)
* REST API architecture
* Hosted on Render

### Deployment

* Frontend → Vercel
* Backend → Render

---

## 📁 Project Structure

```
sustainex/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│
├── frontend/
│   ├── index.html / src/
│   ├── styles/
│   ├── scripts/
│
├── requirements.txt
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the repo

```
git clone https://github.com/tejasr09/sustainex.git
cd sustainex
```

---

### 2. Backend Setup

```
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on:

```
http://localhost:5000
```

---

### 3. Frontend Setup

If static:

* Open `index.html` directly
  or
* Use Live Server (VS Code)

If React:

```
npm install
npm run dev
```

---

## 🔗 API Integration

Frontend communicates with backend using:

```
https://your-render-backend.onrender.com/api
```

Make sure to:

* Replace localhost URLs in production
* Use environment variables for API base URL

---

## 📌 Roadmap

Planned improvements:

* [ ] 🎨 UI/UX enhancements
* [ ] 🗄️ Database integration (PostgreSQL / MongoDB)
* [ ] 🔐 User authentication system
* [ ] 📊 Dashboard with analytics
* [ ] 📜 History tracking for user actions
* [ ] 🤖 AI-based sustainability insights

---

## 🔐 Environment Variables

Example:

```
API_URL=https://your-backend.onrender.com
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is open-source and available under the MIT License.

---

## 👨‍💻 Author

Tejas R
GitHub: https://github.com/tejasr09

---

## 💡 Vision

Inspired by the growing need for sustainable solutions, Sustainex aims to evolve into a data-driven platform that empowers individuals and organizations to make smarter, eco-conscious decisions through technology. ([SustaiNex][1])

---

[1]: https://www.sustainex.ai/?utm_source=chatgpt.com "SustaiNex"
