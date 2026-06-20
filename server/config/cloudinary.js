import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || "dzxbyiusv",
  api_key: process.env.CLOUDINARY_API_KEY || "198373449356439",
  api_secret: process.env.CLOUDINARY_API_SECRET || "C8dq9ieR7sudcnZepir7YHGafSQ",
});

export default cloudinary;
