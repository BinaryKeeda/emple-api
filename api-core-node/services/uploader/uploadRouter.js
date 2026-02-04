import { Router } from "express";
import upload from "../../../config/upload.js";
import { uploadImage } from "./controller/uploadController.js";

const uploadRouter = Router();

uploadRouter.post('/image', upload.single("pdf"),uploadImage );
export default uploadRouter;