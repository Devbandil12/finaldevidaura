import { SignIn, SignUp, SignUpButton, useUser } from "@clerk/clerk-react";
import React from "react";
import { redirect, Router, useNavigate, useRoutes } from "react-router-dom";

function Register() {
  const { user } = useUser();

  if (user) {
    redirect("/");
  }
  return (
    <div class=" flex items-center  justify-center  ">
      <div className=" flex items-center justify-center w-full h-screen "></div>
    </div>
  );
}

export default Register;
