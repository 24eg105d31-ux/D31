export type ResourceStatus = "available" | "occupied" | "booked";

export interface Resource {
  id: string;
  name: string;
  status: ResourceStatus;
  category: "lab" | "classroom" | "hall" | "auditorium";
}

export const resources: Resource[] = [
  { id: "l1", name: "Lab 101", status: "available", category: "lab" },
  { id: "l2", name: "Lab 102", status: "occupied", category: "lab" },
  { id: "l3", name: "Lab 103", status: "available", category: "lab" },
  { id: "l4", name: "Lab 104", status: "occupied", category: "lab" },
  { id: "l5", name: "Lab 105", status: "available", category: "lab" },
  { id: "l6", name: "Lab 106", status: "available", category: "lab" },
  { id: "l7", name: "Lab 107", status: "occupied", category: "lab" },
  { id: "l8", name: "Lab 108", status: "available", category: "lab" },

  { id: "c1", name: "Classroom A1", status: "available", category: "classroom" },
  { id: "c2", name: "Classroom A2", status: "occupied", category: "classroom" },
  { id: "c3", name: "Classroom B1", status: "available", category: "classroom" },
  { id: "c4", name: "Classroom B2", status: "available", category: "classroom" },
  { id: "c5", name: "Classroom C1", status: "occupied", category: "classroom" },
  { id: "c6", name: "Classroom C2", status: "available", category: "classroom" },
  { id: "c7", name: "Classroom C3", status: "available", category: "classroom" },
  { id: "c8", name: "Classroom C4", status: "occupied", category: "classroom" },
  { id: "c9", name: "Classroom D1", status: "available", category: "classroom" },
  { id: "c10", name: "Classroom D2", status: "available", category: "classroom" },
  { id: "c11", name: "Classroom D3", status: "occupied", category: "classroom" },
  { id: "c12", name: "Classroom D4", status: "available", category: "classroom" },

  { id: "h1", name: "Seminar Hall 1", status: "available", category: "hall" },
  { id: "h2", name: "Seminar Hall 2", status: "booked", category: "hall" },
  { id: "h3", name: "Seminar Hall 3", status: "available", category: "hall" },

  { id: "a1", name: "Main Auditorium", status: "booked", category: "auditorium" },
  { id: "a2", name: "Mini Auditorium", status: "available", category: "auditorium" },
];

export const scheduleItems = [
  { type: "lab" as const, label: "Lab Session - CSE Block - 10:00 AM" },
  { type: "lecture" as const, label: "AI Lecture - Seminar Hall - 1:00 PM" },
  { type: "event" as const, label: "Cultural Event - Main Auditorium - 4:00 PM" },
];

export const notificationItems = [
  { type: "success" as const, label: "Lab booking approved" },
  { type: "warning" as const, label: "Projector under maintenance" },
  { type: "error" as const, label: "Seminar Hall booking rejected" },
];

export const resourceTypes = ["Lab", "Classroom", "Seminar Hall", "Auditorium"];

export const timeSlots = [
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
];
