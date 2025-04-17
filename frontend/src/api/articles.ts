import api from "./axios";

export interface Article {
    _id: string;
    titulo: string;
    contenido_markdown: string;
    imagen_url: string;
    autor_id: string;
    fecha_creacion: string;
    tags: string[];
}

export const getArticles = async (): Promise<Article[]> => {
    const res = await api.get("/articles/");
    return res.data;
};
