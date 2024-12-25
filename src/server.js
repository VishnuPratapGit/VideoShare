import connectDB from "./database/index.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

connectDB();
