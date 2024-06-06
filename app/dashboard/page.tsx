import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import React from "react";

const page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return <div>{user?.email}</div>;
};

export default page;
