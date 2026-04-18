"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { LampContainer } from "@/components/ui/lamp"
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
    <div className="min-h-screen bg-[#000000] pb-0 text-[#ffffff]">
      <LampContainer className="rounded-none justify-center gap-0 [&>div:first-child]:!h-[min(48dvh,32rem)] [&>div:first-child]:!min-h-0 [&>div:first-child]:!flex-none [&>div:first-child]:!shrink-0 [&>div:last-child]:pb-0">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-[12px] border border-[#7f1d1d] p-10 shadow-none backdrop-blur-sm"
          style={{
            background: "rgba(0, 0, 0, 0.8)",
            borderWidth: "1px",
          }}
        >
          <h1
            className="text-center leading-none text-[#ef4444]"
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: "56px",
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            Vault
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
      </LampContainer>
    </div>
  )
}
