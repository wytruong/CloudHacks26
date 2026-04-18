"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { GlobePulse } from "@/components/ui/cobe-globe-pulse"
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
    <div className="flex min-h-screen flex-col bg-[#000000] text-[#ffffff] lg:flex-row">
      <div className="relative flex min-h-[42vh] flex-1 items-stretch justify-center bg-[#000000] lg:min-h-screen lg:w-1/2">
        <div className="relative h-full min-h-[320px] w-full max-w-[min(100vw,720px)] p-4 lg:max-w-none lg:p-8">
          <GlobePulse className="h-full w-full max-h-[min(85vh,720px)]" speed={0.002} />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/2 lg:py-0">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-lg border border-[#7f1d1d] bg-[#0a0000] p-8 shadow-none"
          style={{ borderWidth: "1px" }}
        >
          <h1
            className="text-center font-mono font-bold text-[#ef4444]"
            style={{ fontSize: "32px", letterSpacing: "3px" }}
          >
            SENTINEL IQ
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
