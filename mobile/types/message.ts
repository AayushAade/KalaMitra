export interface Message {
  id: string;
  sender: 'Buyer' | 'Artisan';
  text: string;
  time: string;
}
