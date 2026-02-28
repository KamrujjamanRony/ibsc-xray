export interface SeoData {
    title: string;
    description: string;
    image?: string;
    type?: 'website' | 'article' | 'product';
    keywords?: string[] | string;
}