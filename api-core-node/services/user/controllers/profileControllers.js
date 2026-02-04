import axios from "axios";
export const fetchUniversity = async (req, res) => {
  try {
    const response = await axios.get('http://universities.hipolabs.com/search',{
      params: {
        name: req.params.name,
        country:"India"
      }
    });
    res.json(response.data);
  } catch (error) {
    console.log(error.message);
    res.json([])
  }
}

export const completeProfile = async (req,res) => {
    try {
      const { id,name, email , avatar,yearOfGraduation ,phone,specialisation,password,program,semester, university} = req.body;

      const user = req.user

    } catch (error) {
      
    }
}