"use client"

import { cn } from "@/lib/utils"
import { ArrowPathIcon, Cog6ToothIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"

type LoadingProps = {
  message?: string
  className?: string
  spinnerClassName?: string
  messageClassName?: string
  fullScreen?: boolean
}

type InlineLoadingProps = {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
  variant?: "default" | "subtle" | "primary"
}

export default function Loading({
  message = "Loading...",
  className = "",
  spinnerClassName = "",
  messageClassName = "",
  fullScreen = true
}: LoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex items-center justify-center bg-background/80",
        fullScreen ? "fixed inset-0 backdrop-blur-lg z-50" : "w-full h-full",
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: {
              duration: 2,
              ease: "linear",
              repeat: Infinity,
            },
            scale: {
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            },
          }}
        >
          <Cog6ToothIcon className={cn(
            "text-primary h-12 w-12",
            spinnerClassName
          )} />
        </motion.div>
        
        <motion.p 
          className={cn(
            "text-lg font-medium text-foreground",
            messageClassName
          )}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  )
}

export function InlineLoading({
  message = "Loading...",
  size = "sm",
  className,
  variant = "default"
}: InlineLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const variantClasses = {
    default: "text-foreground",
    subtle: "text-muted-foreground",
    primary: "text-primary",
  }

  return (
    <motion.div 
      className={cn("flex items-center space-x-2", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1.5,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        <ArrowPathIcon className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )} />
      </motion.div>
      
      <motion.span 
        className="text-sm"
        animate={{
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {message}
      </motion.span>
    </motion.div>
  )
}