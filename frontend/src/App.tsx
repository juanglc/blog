// In your App.tsx file
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ArticlePage from './pages/ArticlePage.tsx';
import ArticleCards from './components/ArticleCards';
import NewArticle from './pages/NewArticle';
import UpdateArticle from "./pages/UpdateArticle.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/articles" replace />} />
                <Route path="/articles/:id" element={<ArticlePage />} />
                <Route path="/articles" element={<ArticleCards />} />
                <Route path="/articles/new" element={<NewArticle />} />
                <Route path="/articles/update/:id" element={<UpdateArticle />} />
                <Route path="/tags/:tagId" element={<ArticleCards />} />
                <Route path="/authors/:authorId" element={<ArticleCards />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;