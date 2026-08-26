import { Message } from '../types';

export const mockMessagesMap: { [inquiryId: string]: Message[] } = {
  "inq-1001": [
    {
      id: "msg-1",
      sender: "Buyer",
      text: "Namaste! Interested in purchasing 100 units of Bamboo Storage Basket for our retail chain in Mumbai. Please confirm bulk discount and estimated timeline.",
      time: "10:30 AM"
    }
  ],
  "inq-1002": [
    {
      id: "msg-101",
      sender: "Buyer",
      text: "Can we request custom blue motifs on the border for a festive order of 25 dupattas?",
      time: "Yesterday, 4:15 PM"
    },
    {
      id: "msg-102",
      sender: "Artisan",
      text: "Namaste! Yes, we can customize the zari motifs with indigo blue dye. It will take 7 days for production.",
      time: "Yesterday, 5:00 PM"
    }
  ]
};
