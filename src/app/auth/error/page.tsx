"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
                    <p className="text-gray-600 mb-4">There was an error during the authentication process.</p>
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                            <p className="text-sm text-red-800">Error: {error}</p>
                        </div>
                    )}
                    <button onClick={() => window.close()} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function AuthError() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    )
}
