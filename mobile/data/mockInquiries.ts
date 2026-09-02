import { Inquiry } from '../types';

export const mockInquiries: Inquiry[] = [
  {
    id: "inq-1001",
    productId: "prod-2",
    productTitle: "Bamboo Storage Basket",
    productPrice: 899,
    productImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXcQG2IuC0hmcLXI_X7NLHkQS6FBTajGjmTZYlqwFRaBAchUoU9qXJYnXU85awVMUWhJLn6H8iREvMMm0LOxSqbKMT3mofJ_m9uovpzG-9Knzfv04Z_EPyVum0R5IpYVXGknClHW3hb2Y-ruGkmYBiyFRQFAP6Eg0B56uJ0abfnjTmc45ApRtHGAQFhn7toeu_imQWT1-rgMhI0iK3mklaTSDTIIQHHUHyKPtXnzS7CEQMqVR4xNud",
    buyerName: "Raj Traders",
    buyerType: "Retail Distributor",
    buyerLocation: "Mumbai, Maharashtra",
    quantity: 100,
    expectedDelivery: "2026-09-20",
    message: "Namaste! Interested in purchasing 100 units of Bamboo Storage Basket for our retail chain in Mumbai. Please confirm bulk discount and estimated timeline.",
    status: "New",
    date: "Today, 10:30 AM"
  },
  {
    id: "inq-1002",
    productId: "prod-1",
    productTitle: "Handwoven Red and Gold Silk Dupatta",
    productPrice: 1850,
    productImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9NdqtHHuX-C3fTyPOFZyJHmhxGdmIUVFNHQnBFec-x4sM6nam9v8zGl_A50EYGmZPn11LroWhvKHY5FCPYBHMXB8smCONqVv0H_O5bW-yoFUMcCyNZrnpHOq1c5STMMu_HCBEfCqtgew-DNpDA_CpmKQ8Hqd4TNZ9Ul3u_9AuI_LdlQ_rhb5UzODrcnCCzKSeWTTtYcrI2hIt2BuU6Z06-W5UYr8AKVJJQ3n9_6C3Kg4iBz6f2QhI",
    buyerName: "Heritage Boutique",
    buyerType: "Boutique Store",
    buyerLocation: "Delhi",
    quantity: 25,
    expectedDelivery: "2026-09-15",
    message: "Can we request custom blue motifs on the border for a festive order of 25 dupattas?",
    status: "Replied",
    date: "Yesterday, 4:15 PM"
  }
];
