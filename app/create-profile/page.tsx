

"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type ApiResponse = {
  message: string;
  error?: string;
};

async function createProfileRequest(): Promise<ApiResponse> {
  const response = await fetch('/api/create-profile', {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  return data as ApiResponse;
}

export default function CreateProfile() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

const mutation = useMutation<ApiResponse, Error>({
  mutationFn: createProfileRequest,
  onSuccess: () => { router.push("/subscribe"); },
  onError: (error: Error) => { console.log(error); },
});


  useEffect(() => {
    if (isLoaded && isSignedIn && !mutation.isPending) {
      mutation.mutate();
    }
  }, [isLoaded, isSignedIn, mutation.isPending, mutation.mutate]);

  return <div>Processing sign in....</div>;
}
