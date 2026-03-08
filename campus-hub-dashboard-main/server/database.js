import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "database.json");

// Initialize empty database if it doesn't exist
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    const initialData = {
      users: [
        {
          id: "1",
          name: "Admin",
          email: "admin@crms.edu",
          password: hashedPassword,
          role: "admin",
          createdAt: new Date().toISOString()
        }
      ],
      bookings: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

initDatabase();

function readDatabase() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return { users: [], bookings: [] };
  }
}

function writeDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Initialize resources in database
function initResources() {
  const db = readDatabase();
  if (!db.resources || db.resources.length === 0) {
    db.resources = [
      // Labs
      { id: "l1", name: "Lab 101", type: "lab", capacity: 30, status: "available", building: "CSE Block" },
      { id: "l2", name: "Lab 102", type: "lab", capacity: 30, status: "occupied", building: "CSE Block" },
      { id: "l3", name: "Lab 103", type: "lab", capacity: 30, status: "available", building: "CSE Block" },
      { id: "l4", name: "Lab 104", type: "lab", capacity: 30, status: "occupied", building: "CSE Block" },
      { id: "l5", name: "Lab 105", type: "lab", capacity: 25, status: "available", building: "CSE Block" },
      { id: "l6", name: "Lab 106", type: "lab", capacity: 25, status: "available", building: "CSE Block" },
      { id: "l7", name: "Lab 107", type: "lab", capacity: 30, status: "occupied", building: "CSE Block" },
      { id: "l8", name: "Lab 108", type: "lab", capacity: 30, status: "available", building: "CSE Block" },
      // Classrooms
      { id: "c1", name: "Classroom A1", type: "classroom", capacity: 60, status: "available", building: "Block A" },
      { id: "c2", name: "Classroom A2", type: "classroom", capacity: 60, status: "occupied", building: "Block A" },
      { id: "c3", name: "Classroom B1", type: "classroom", capacity: 50, status: "available", building: "Block B" },
      { id: "c4", name: "Classroom B2", type: "classroom", capacity: 50, status: "available", building: "Block B" },
      { id: "c5", name: "Classroom C1", type: "classroom", capacity: 40, status: "occupied", building: "Block C" },
      { id: "c6", name: "Classroom C2", type: "classroom", capacity: 40, status: "available", building: "Block C" },
      { id: "c7", name: "Classroom C3", type: "classroom", capacity: 45, status: "available", building: "Block C" },
      { id: "c8", name: "Classroom C4", type: "classroom", capacity: 45, status: "occupied", building: "Block C" },
      { id: "c9", name: "Classroom D1", type: "classroom", capacity: 35, status: "available", building: "Block D" },
      { id: "c10", name: "Classroom D2", type: "classroom", capacity: 35, status: "available", building: "Block D" },
      { id: "c11", name: "Classroom D3", type: "classroom", capacity: 35, status: "occupied", building: "Block D" },
      { id: "c12", name: "Classroom D4", type: "classroom", capacity: 35, status: "available", building: "Block D" },
      // Halls
      { id: "h1", name: "Seminar Hall 1", type: "hall", capacity: 100, status: "available", building: "Admin Block" },
      { id: "h2", name: "Seminar Hall 2", type: "hall", capacity: 80, status: "booked", building: "Admin Block" },
      { id: "h3", name: "Seminar Hall 3", type: "hall", capacity: 50, status: "available", building: "Admin Block" },
      // Auditoriums
      { id: "a1", name: "Main Auditorium", type: "auditorium", capacity: 500, status: "booked", building: "Cultural Block" },
      { id: "a2", name: "Mini Auditorium", type: "auditorium", capacity: 150, status: "available", building: "Cultural Block" },
    ];
    writeDatabase(db);
  }
}

initResources();

// Resource functions
export function getAllResources() {
  const db = readDatabase();
  return db.resources || [];
}

export function getResourcesByType(type) {
  const db = readDatabase();
  return (db.resources || []).filter(r => r.type === type);
}

export function getResourceById(id) {
  const db = readDatabase();
  return (db.resources || []).find(r => r.id === id);
}

export function updateResourceStatus(id, status) {
  const db = readDatabase();
  const resourceIndex = (db.resources || []).findIndex(r => r.id === id);
  
  if (resourceIndex !== -1) {
    db.resources[resourceIndex].status = status;
    db.resources[resourceIndex].updatedAt = new Date().toISOString();
    writeDatabase(db);
    return db.resources[resourceIndex];
  }
  
  return null;
}

// Maintenance functions
export function createMaintenanceRequest(request) {
  const db = readDatabase();
  
  if (!db.maintenance) {
    db.maintenance = [];
  }
  
  const newRequest = {
    id: Date.now().toString(),
    ...request,
    status: "pending", // pending, in-progress, completed
    createdAt: new Date().toISOString()
  };
  
  db.maintenance.push(newRequest);
  writeDatabase(db);
  
  return newRequest.id;
}

export function getAllMaintenanceRequests() {
  const db = readDatabase();
  return (db.maintenance || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMaintenanceById(id) {
  const db = readDatabase();
  return (db.maintenance || []).find(r => r.id === id);
}

export function updateMaintenanceStatus(id, status) {
  const db = readDatabase();
  const requestIndex = (db.maintenance || []).findIndex(r => r.id === id);
  
  if (requestIndex !== -1) {
    db.maintenance[requestIndex].status = status;
    db.maintenance[requestIndex].updatedAt = new Date().toISOString();
    writeDatabase(db);
    return db.maintenance[requestIndex];
  }
  
  return null;
}

export function getUserMaintenanceRequests(userId) {
  const db = readDatabase();
  return (db.maintenance || [])
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// User functions
export function createUser(name, email, password, role = "user") {
  const db = readDatabase();
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  writeDatabase(db);
  
  return newUser.id;
}

export function findUserByEmail(email) {
  const db = readDatabase();
  return db.users.find(user => user.email === email);
}

export function verifyPassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

export function getUserById(id) {
  const db = readDatabase();
  return db.users.find(user => user.id === id);
}

// Booking functions
export function createBooking(booking) {
  const db = readDatabase();
  
  const newBooking = {
    id: Date.now().toString(),
    ...booking,
    status: "pending", // pending, approved, rejected
    createdAt: new Date().toISOString()
  };
  
  db.bookings.push(newBooking);
  writeDatabase(db);
  
  return newBooking.id;
}

export function getAllBookings() {
  const db = readDatabase();
  return db.bookings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getPendingBookings() {
  const db = readDatabase();
  return db.bookings
    .filter(booking => booking.status === "pending")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getBookingById(id) {
  const db = readDatabase();
  return db.bookings.find(booking => booking.id === id);
}

export function updateBookingStatus(id, status) {
  const db = readDatabase();
  const bookingIndex = db.bookings.findIndex(booking => booking.id === id);
  
  if (bookingIndex !== -1) {
    db.bookings[bookingIndex].status = status;
    db.bookings[bookingIndex].updatedAt = new Date().toISOString();
    writeDatabase(db);
    return db.bookings[bookingIndex];
  }
  
  return null;
}

export default {
  createUser,
  findUserByEmail,
  verifyPassword,
  getUserById,
  createBooking,
  getAllBookings,
  getPendingBookings,
  getBookingById,
  updateBookingStatus
};
