"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { GlobePulse } from "@/components/ui/cobe-globe-pulse"
import { TextMarque } from "@/components/ui/text-marque"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#000000] text-[#ffffff] lg:h-[100dvh] lg:min-h-0 lg:flex-row lg:overflow-hidden">
      <div className="relative flex h-[50dvh] min-h-0 w-full flex-col bg-[#000000] lg:h-full lg:w-1/2">
        <div className="relative flex h-full min-h-0 w-full flex-col">
          <GlobePulse
            className="h-full w-full min-h-0 !aspect-auto"
            speed={0.002}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 w-full space-y-1">
            <TextMarque
              baseVelocity={-0.8}
              text="AUTONOMOUS THREAT DETECTION"
              className="font-bold tracking-[-0.07em] text-[#7f1d1d] text-sm"
            />
            <TextMarque
              baseVelocity={0.8}
              text="ACCOUNT SECURITY IN 4 SECONDS"
              className="font-bold tracking-[-0.07em] text-[#ef4444] text-sm"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/2 lg:py-0">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-lg border border-[#7f1d1d] bg-[#0a0000] p-8 shadow-none"
          style={{ borderWidth: "1px" }}
        >
          <h1
            className="text-center font-mono leading-none text-[#ef4444]"
            style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "-0.06em" }}
          >
            VAULT
          </h1>
          <p className="mt-2 text-center text-[13px] text-[#9ca3af]">
            Security Operations Platform
          </p>
          <div className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
                Company Email
              </span>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10 border-[#2a0a0a] bg-[#0a0000] text-sm text-[#ffffff] placeholder:text-[#6b7280] focus-visible:border-[#ef4444] focus-visible:ring-0"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
                Password
              </span>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 border-[#2a0a0a] bg-[#0a0000] text-sm text-[#ffffff] placeholder:text-[#6b7280] focus-visible:border-[#ef4444] focus-visible:ring-0"
              />
            </label>
          </div>
          <Button
            type="submit"
            className="mt-8 h-10 w-full rounded-lg border-0 bg-[#ef4444] text-sm font-medium text-[#ffffff] hover:bg-[#dc2626]"
          >
            Access SOC Dashboard
          </Button>
          <div className="mt-8 space-y-1 text-center font-mono text-[11px] leading-relaxed text-[#4b5563]">
            <p>Secured by AWS Bedrock AgentCore + Amazon Kinesis</p>
            <p>Authorized personnel only</p>
          </div>
        </form>
      </div>
    </div>
  )
}
