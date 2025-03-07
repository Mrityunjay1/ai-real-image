"use client"

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import  toast, { Toaster }  from "react-hot-toast";

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError:(error)=>{
            toast.error(error.message)
        }
    })
});


export default function Providers({children}: {children: React.ReactNode}) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
        </QueryClientProvider>
    )
}

