export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

// النوع اللي بيرجع من الـ API مباشرة
export interface ApiChatMessage {
  _id?: string;
  id?: string;
  role: 'user' | 'model';
  text: string;
}