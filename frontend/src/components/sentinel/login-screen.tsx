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
    <div className="flex min-h-screen flex-col bg-[#0a0e1a] text-foreground lg:flex-row">
      <div className="relative flex min-h-[42vh] flex-1 items-stretch justify-center bg-[#0a0e1a] lg:min-h-screen lg:w-1/2">
        <div className="relative h-full min-h-[320px] w-full max-w-[min(100vw,720px)] p-4 lg:max-w-none lg:p-8">
          <GlobePulse className="h-full w-full max-h-[min(85vh,720px)]" speed={0.002} />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/2 lg:py-0">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-lg border border-[#1e2a44] bg-[#0f1424] p-8 shadow-none"
          style={{ borderWidth: "0.5px" }}
        >
          <h1
            className="text-center font-mono text-2xl font-bold tracking-tight text-[#4a9eff]"
            style={{ fontSize: "24px" }}
          >
            SENTINEL IQ
          </h1>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            Security Operations Platform
          </p>
          <div className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Company Email
              </span>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10 border-[#1e2a44] bg-[#0a0e1a] text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Password
              </span>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 border-[#1e2a44] bg-[#0a0e1a] text-sm"
              />
            </label>
          </div>
          <Button
            type="submit"
            className="mt-8 h-10 w-full rounded-lg border-0 bg-[#3b82f6] text-sm font-medium text-white hover:bg-[#3b82f6]/90"
          >
            Access SOC Dashboard
          </Button>
          <div className="mt-8 space-y-1 text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
            <p>Secured by AWS Bedrock AgentCore + Amazon Kinesis</p>
            <p>Authorized personnel only</p>
          </div>
        </form>
      </div>
    </div>
  )
}
