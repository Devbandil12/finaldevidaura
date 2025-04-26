import { SignIn, SignUp, SignUpButton, useUser } from "@clerk/clerk-react";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const { user } = useUser();
  const navigate = useNavigate();
  return (
    <div class=" flex items-center  justify-center  ">
      <div className=" flex items-center justify-center w-full h-screen ">
        {user ? navigate("/") : <SignIn />}
      </div>
    </div>
  );
}

export default Register;
