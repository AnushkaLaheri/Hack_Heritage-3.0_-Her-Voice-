# Gender Equality Dashboard

## Overview
A comprehensive single-page Gender Equality Dashboard built with React, Material-UI, and Recharts for data visualization.

## Features

### 1. Gender Pay Gap Overview
- **Visual**: Interactive bar chart showing pay gap by sector
- **Data**: Real-time percentage values
- **Colors**: Blue theme (#1976d2)

### 2. Women in Leadership
- **Visual**: Pie chart showing women vs men ratio
- **Data**: 28.3% women in leadership positions
- **Colors**: Purple theme (#9c27b0)

### 3. Market Overview
- **Interactive**: Dropdown to select different fields (IT, Finance, Healthcare, Education)
- **Visual**: Bar chart showing women vs men ratio
- **Colors**: Orange theme (#ff9800)

### 4. Company Ratings
- **Search**: Real-time company search functionality
- **Rating**: 5-star rating system for safety, pay equality, and culture
- **Data**: Company-specific ratings and reviews

### 5. Pay Gap Trends
- **Visual**: Line chart showing trends over 5 years (2020-2024)
- **Data**: Decreasing trend from 25.5% to 22.9%
- **Colors**: Green theme (#4caf50)

### 6. Fun Facts
- **Interactive**: Chip-based fun facts about gender equality
- **Content**: STEM fields, ROI, team performance, revenue statistics

### 7. Feedback Form
- **Types**: Suggestions, complaints, appreciation
- **Validation**: Required fields with error handling
- **Integration**: Ready for backend API integration

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **Recharts** for data visualization
- **Redux Toolkit** for state management
- **Responsive Design** with Grid system

### Backend (Ready for Integration)
- **Flask** REST API endpoints
- **SQLAlchemy** ORM
- **SQLite** database (easily switchable to MongoDB)
- **CORS** enabled for cross-origin requests

## API Endpoints

### GET /api/equality/paygap
- Returns gender pay gap data by sector and year

### GET /api/equality/leadership
- Returns women in leadership statistics

### GET /api/equality/fields/:name
- Returns women/men ratio for specific field

### GET /api/equality/companies
- Returns company ratings and reviews

### POST /api/equality/feedback
- Submits user feedback

## Installation & Setup

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Usage

1. **View Dashboard**: Navigate to `/equality` route
2. **Search Companies**: Use the search bar to find specific companies
3. **Select Fields**: Use dropdown to view different industry ratios
4. **Submit Feedback**: Fill out the feedback form at the bottom

## Design Principles

- **Soft Colors**: Blue, purple, white theme for equality vibes
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: WCAG 2.1 compliant
- **Modern**: Clean, minimal design with proper spacing

## Future Enhancements

- [ ] Real-time data from MongoDB
- [ ] User authentication for feedback
- [ ] Advanced filtering and search
- [ ] Export functionality for reports
- [ ] Multi-language support
- [ ] Dark mode toggle

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - Feel free to use and modify as needed.
