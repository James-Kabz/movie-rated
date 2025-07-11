"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function MobileCallbackContent() {
    const searchParams = useSearchParams()
    const [token, setToken] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const handleMobileRedirect = async () => {
            try {
                // Get the current session
                const response = await fetch("/api/auth/session")
                const session = await response.json()

                if (session && session.user) {
                    // Create a temporary token for the mobile app
                    const tokenResponse = await fetch("/api/auth/mobile-token", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    })

                    if (tokenResponse.ok) {
                        const { token: authToken } = await tokenResponse.json()
                        setToken(authToken)

                        // Try deep link first (but don't rely on it)
                        const mobileUrl = `cinetaste://auth-callback?success=true&token=${encodeURIComponent(authToken)}`
                        console.log("Attempting deep link:", mobileUrl)

                        try {
                            window.location.href = mobileUrl
                        } catch (e) {
                            console.log("Deep link failed, showing manual options")
                        }
                    } else {
                        throw new Error("Failed to create mobile token")
                    }
                } else {
                    throw new Error("No session found - please complete sign in first")
                }
            } catch (error: Error | any) {
                console.error("Mobile callback error:", error)
                setError(error.message || "Authentication failed")
            } finally {
                setLoading(false)
            }
        }

        handleMobileRedirect()
    }, [])

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(token)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea")
            textArea.value = token
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand("copy")
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const generateQRCode = (text: string) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h1 className="text-xl font-semibold text-gray-900">Completing authentication...</h1>
                    <p className="text-gray-600 mt-2">Please wait while we set up your session.</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-red-600 mb-2">Authentication Failed</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.close()}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Authentication Successful!</h1>
                    <p className="text-gray-600 text-sm">
                        Complete the setup by copying the token below or scanning the QR code in your mobile app.
                    </p>
                </div>

                {/* QR Code */}
                <div className="text-center mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg inline-block">
                        <img
                            src={generateQRCode(token) || "/placeholder.svg"}
                            alt="Authentication QR Code"
                            className="w-48 h-48 mx-auto"
                            onError={(e) => {
                                // (e.target as HTMLImageElement).style.display = "none"
                                //     (e.target.nextSibling as HTMLElement).style.display = "block"
                            }}
                        />
                        <div style={{ display: "none" }} className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">QR Code unavailable</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Scan this QR code with your mobile app</p>
                </div>

                {/* Manual Token Copy */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Or copy this token:</label>
                    <div className="flex">
                        <input
                            type="text"
                            value={token}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm font-mono"
                        />
                        <button
                            onClick={copyToClipboard}
                            className={`px-4 py-2 rounded-r-lg border border-l-0 border-gray-300 transition-colors ${copied
                                ? "bg-green-500 text-white"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
                    <ol className="text-sm text-blue-800 space-y-1">
                        <li>1. Open your Cinetaste mobile app</li>
                        <li>2. Go to the login screen</li>
                        <li>3. Tap "Enter Token Manually"</li>
                        <li>4. Paste the token above</li>
                    </ol>
                </div>

                <button
                    onClick={() => window.close()}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                    Close Window
                </button>
            </div>
        </div>
    )
}

export default function MobileCallback() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            }
        >
            <MobileCallbackContent />
        </Suspense>
    )
}
