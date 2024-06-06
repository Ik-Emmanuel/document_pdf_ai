"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "../_trcp/client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin");

  const [response, setResponse] = useState(undefined);

  const { data, isSuccess, isError, error } = trpc.authCallback.useQuery(
    undefined,
    {
      // onSuccess: ({ success }) => {
      //   if (success) {
      //     // user is synced to db
      //     router.push(origin ? `/${origin}` : "/dashboard");
      //   }
      // },
      // onError: (err) => {
      //   if (err.data?.code === "UNAUTHORIZED") {
      //     router.push("/sign-in");
      //   }
      // },
      retry: true,
      retryDelay: 500,
    }
  );

  // react tanc stack query onSuccess is depreicated
  //tanstack.com/query/latest/docs/framework/react/reference/useQuery#:%7E:text=onSuccess%3A%20(data%3A%20TData,next%20major%20version

  https: useEffect(() => {
    if (error) {
      // something went wrong
      router.push("/sign-in");
    }

    if (data?.success) {
      // user is synced to db
      router.push(origin ? `/${origin}` : "/dashboard");
    }
  }, [data, origin, router, error]);

  return (
    <div className="w-full mt-24 flex justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-800" />
        <h3 className="font-semibold text-xl">Setting up your account...</h3>
        <p>You will be redirected automatically.</p>
      </div>
    </div>
  );
};

export default Page;
