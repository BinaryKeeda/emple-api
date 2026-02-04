export const uploadImage = async (req,res) => {
    try{
        if(!req.file) return res.status(500).json({message : "Please upload an image"});
        return res.status(200).json({messgae:"Image Uploaded" , url : req.file.path});
    }catch(e) {
        return res.status(500).json({message : "Internal Server Error"});
    }
}