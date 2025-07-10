"use client"

import {  useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

function MobileCallbackContent() {
    const searchParams = useSearchParams()

    useEffect(() => {
        const handleMobileRedirect = async () => {
            try {
                // Get the session token or create one
                const response = await fetch("/api/auth/session")
                const session = await response.json()

                if (session && session.user) {
                    // Create a temporary token for the mobile app
                    const tokenResponse = await fetch("/api/auth/mobile-token", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ session }),
                    })

                    if (tokenResponse.ok) {
                        const { token } = await tokenResponse.json()

                        // Redirect to mobile app with token
                        const mobileUrl = `cinetaste://auth-callback?success=true&token=${encodeURIComponent(token)}`
                        console.log("Redirecting to mobile app:", mobileUrl)

                        // Try to redirect to mobile app
                        window.location.href = mobileUrl

                        // Show success message as fallback
                        setTimeout(() => {
                            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; background: #f9fafb;">
                  <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px;">
                    <div style="width: 48px; height: 48px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                      <svg style="width: 24px; height: 24px; color: white;" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <h1 style="color: #10b981; margin: 0 0 0.5rem; font-size: 1.5rem; font-weight: 600;">Authentication Successful!</h1>
                    <p style="color: #6b7280; margin: 0 0 1.5rem; font-size: 0.875rem;">You can now close this window and return to the app.</p>
                    <button onclick="window.close()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Close Window</button>
                  </div>
                </div>
              `
                        }, 2000)
                    } else {
                        throw new Error("Failed to create mobile token")
                    }
                } else {
                    throw new Error("No session found")
                }
            } catch (error) {
                console.error("Mobile callback error:", error)
                document.body.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; background: #f9fafb;">
            <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px;">
              <div style="width: 48px; height: 48px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                <svg style="width: 24px; height: 24px; color: white;" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h1 style="color: #ef4444; margin: 0 0 0.5rem; font-size: 1.5rem; font-weight: 600;">Authentication Failed</h1>
              <p style="color: #6b7280; margin: 0 0 1.5rem; font-size: 0.875rem;">There was an error during authentication. Please try again.</p>
              <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Close Window</button>
            </div>
          </div>
        `
            }
        }

        handleMobileRedirect()
    }, [searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h1 className="text-xl font-semibold text-gray-900">Completing authentication...</h1>
                <p className="text-gray-600 mt-2">Please wait while we redirect you back to the app.</p>
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
