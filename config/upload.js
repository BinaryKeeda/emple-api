import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    cloud_name: "drzyrq7d5",    
    api_key: "585179992638461",    
    api_secret: "3r7NuV7KipN0JTbtzfn4hEpGcOs", 
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'binarykeedaa',
    allowed_formats: ['jpg', 'png', 'jpeg' , 'pdf'], // Allowed file formats
    public_id: (req, file) => `image_${Date.now()}`, // Optional: Custom naming for files
  },
});

const upload = multer({ storage });

export default upload;


