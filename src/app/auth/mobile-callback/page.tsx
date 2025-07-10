"use client"

import { useSearchParams } from "next/navigation"
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
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
                  <h1 style="color: #10b981;">Authentication Successful!</h1>
                  <p>You can now close this window and return to the app.</p>
                  <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
                </div>
              `
            }, 1000)
          } else {
            throw new Error("Failed to create mobile token")
          }
        } else {
          throw new Error("No session found")
        }
      } catch (error) {
        console.error("Mobile callback error:", error)
        document.body.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
            <h1 style="color: #ef4444;">Authentication Failed</h1>
            <p>There was an error during authentication. Please try again.</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
          </div>
        `
      }
    }

    handleMobileRedirect()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
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
