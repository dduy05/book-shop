export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  quantity?: number;
  image: string;
  description: string;
  category_id?: number;
  category_name?: string;
}