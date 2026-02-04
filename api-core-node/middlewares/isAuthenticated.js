export const isAdmin =  async (req,res,next) => {
  // if(req.isAuthenticated() && req.user.role == 'admin') {
  //   next();
  // }else{ 
  //   return res.status(401).json({message :"Page not found"});
  // }
  next()
}


export const isUser = (req, res, next) => {
  // if (req.isAuthenticated()) return next();
  // return res.status(401).json({ message: 'Unauthorised' });
  next();
}

export const isCorrectUser = (req,res, next) => {
  next();
  // if(req.isAuthenticated()) {
  //   if(req.user._id == req.body.userId) {
  //     next();
  //   }
  // }else{
  // return res.status(401).json({ message: 'Unauthorised' });
  // }
}